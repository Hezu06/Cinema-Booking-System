import http from "node:http";
import { BrevoEmailGateway } from "../src/data-access/gateways/email.gateway.js";
import { GoogleOAuthGateway } from "../src/data-access/gateways/google-oauth.gateway.js";
import { TmdbGateway } from "../src/data-access/gateways/tmdb.gateway.js";
import { CircuitState } from "../src/data-access/resilience/circuit-breaker.js";

async function runAllCircuitBreakerVerification() {
  console.log("================================================================================");
  console.log("🛡️ VERIFYING CIRCUIT BREAKER PATTERN ACROSS ALL SYSTEM EXTERNAL APIS");
  console.log("   1. Brevo Email API (HTTPS REST)");
  console.log("   2. Google OAuth 2.0 Identity API (HTTPS REST)");
  console.log("   3. TheMovieDB / TMDB API (HTTPS REST)");
  console.log("================================================================================\n");

  // Setup Mock Chaos External Server
  const CHAOS_PORT = 9977;
  const delayMs = 600;
  const statusCode = 500;

  const chaosServer = http.createServer((req, res) => {
    setTimeout(() => {
      res.writeHead(statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "CHAOS_INDUCED_OUTAGE", message: "Third-party service failure" }));
    }, delayMs);
  });

  await new Promise<void>((resolve) => chaosServer.listen(CHAOS_PORT, resolve));
  const chaosUrl = `http://127.0.0.1:${CHAOS_PORT}`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: BREVO EMAIL GATEWAY CIRCUIT BREAKER
    // -------------------------------------------------------------------------
    console.log("▶ [1/3] TESTING BREVO EMAIL GATEWAY CIRCUIT BREAKER...");
    process.env.BREVO_API_URL = `${chaosUrl}/v3/smtp/email`;
    process.env.BREVO_API_KEY = "dummy_key_to_force_network_call";

    const emailGateway = new BrevoEmailGateway({
      name: "BrevoTestBreaker",
      timeoutMs: 300,
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      resetTimeoutMs: 2000,
    });

    console.log(`   Initial Circuit State: ${emailGateway.breaker.getState()}`);
    if (emailGateway.breaker.getState() !== CircuitState.CLOSED) {
      throw new Error("Expected Brevo circuit breaker to start in CLOSED");
    }

    // Trigger failures to trip the circuit
    console.log("   Simulating Brevo downtime/timeouts to trip circuit...");
    for (let i = 1; i <= 4; i++) {
      const t0 = Date.now();
      await emailGateway.sendVerificationEmail(`test${i}@example.com`, `User ${i}`, "123456");
      console.log(`   • Attempt #${i} finished in ${Date.now() - t0}ms`);
    }

    const emailState = emailGateway.breaker.getState();
    console.log(`   Circuit State after failure burst: ${emailState}`);
    if (emailState !== CircuitState.OPEN) {
      throw new Error(`Expected Brevo circuit state to be OPEN, got ${emailState}`);
    }
    console.log("   ✓ Brevo Circuit Breaker successfully TRIPPED to OPEN!");

    // Test fast-fail fallback in OPEN state
    const emailFastStart = Date.now();
    await emailGateway.sendBookingTicketEmail({
      to: "customer@example.com",
      name: "Customer",
      bookingCode: "TEST-CB-01",
      bookingId: "b-01",
      movieTitle: "Venom: Kèo Cuối",
      cinemaName: "CGV Landmark 81",
      cinemaAddress: "TP.HCM",
      roomName: "Phòng 1",
      startTime: new Date(),
      seatLabels: ["E1", "E2"],
      totalAmount: 180000,
      ticketUrl: "http://example.com/ticket",
    });
    const emailFastDuration = Date.now() - emailFastStart;
    console.log(`   Fast-fail response time: ${emailFastDuration}ms (< 50ms expected)`);
    if (emailFastDuration > 50) {
      throw new Error(`Brevo fast fallback took too long: ${emailFastDuration}ms`);
    }
    console.log("   ✅ [BREVO EMAIL API] Circuit Breaker: VERIFIED STABLE & PROTECTED\n");

    // -------------------------------------------------------------------------
    // TEST 2: GOOGLE OAUTH GATEWAY CIRCUIT BREAKER
    // -------------------------------------------------------------------------
    console.log("▶ [2/3] TESTING GOOGLE OAUTH GATEWAY CIRCUIT BREAKER...");
    process.env.GOOGLE_OAUTH_URL = `${chaosUrl}/tokeninfo`;
    const googleGateway = new GoogleOAuthGateway({
      name: "GoogleTestBreaker",
      timeoutMs: 300,
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      resetTimeoutMs: 2000,
    });

    console.log(`   Initial Circuit State: ${googleGateway.breaker.getState()}`);
    if (googleGateway.breaker.getState() !== CircuitState.CLOSED) {
      throw new Error("Expected Google OAuth circuit breaker to start in CLOSED");
    }

    // Trigger failures to trip the circuit
    console.log("   Simulating Google Identity downtime/timeouts to trip circuit...");
    for (let i = 1; i <= 4; i++) {
      const t0 = Date.now();
      try {
        await googleGateway.verifyIdToken(`fake_jwt_token_for_circuit_test_${i}.part2.part3`);
      } catch {
        // Expected
      }
      console.log(`   • Attempt #${i} finished in ${Date.now() - t0}ms`);
    }

    const googleState = googleGateway.breaker.getState();
    console.log(`   Circuit State after failure burst: ${googleState}`);
    if (googleState !== CircuitState.OPEN) {
      throw new Error(`Expected Google OAuth circuit state to be OPEN, got ${googleState}`);
    }
    console.log("   ✓ Google OAuth Circuit Breaker successfully TRIPPED to OPEN!");

    // Test fast-fail fallback in OPEN state
    const googleFastStart = Date.now();
    let googleRejected = false;
    try {
      await googleGateway.verifyIdToken("fake_token_in_open_state.part2.part3");
    } catch (err: any) {
      googleRejected = true;
      if (!err.message.includes("Circuit Breaker OPEN")) {
        throw new Error("Expected friendly Circuit Breaker OPEN fallback message");
      }
    }
    const googleFastDuration = Date.now() - googleFastStart;
    console.log(`   Fast-fail response time: ${googleFastDuration}ms (< 50ms expected)`);
    if (!googleRejected || googleFastDuration > 50) {
      throw new Error(`Google OAuth fast-fail failed or took too long: ${googleFastDuration}ms`);
    }
    console.log("   ✅ [GOOGLE OAUTH API] Circuit Breaker: VERIFIED STABLE & PROTECTED\n");

    // -------------------------------------------------------------------------
    // TEST 3: TMDB MOVIE GATEWAY CIRCUIT BREAKER
    // -------------------------------------------------------------------------
    console.log("▶ [3/3] TESTING TMDB MOVIE GATEWAY CIRCUIT BREAKER...");
    process.env.TMDB_API_URL = `${chaosUrl}/movie/now_playing`;
    process.env.TMDB_API_KEY = "dummy_key_to_force_network_call";

    const tmdbTestGateway = new TmdbGateway({
      name: "TmdbTestBreaker",
      timeoutMs: 300,
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      resetTimeoutMs: 2000,
    });

    console.log(`   Initial Circuit State: ${tmdbTestGateway.breaker.getState()}`);
    if (tmdbTestGateway.breaker.getState() !== CircuitState.CLOSED) {
      throw new Error("Expected TMDB circuit breaker to start in CLOSED");
    }

    // Trigger failures to trip the circuit
    console.log("   Simulating TMDB downtime/timeouts to trip circuit...");
    for (let i = 1; i <= 4; i++) {
      const t0 = Date.now();
      const movies = await tmdbTestGateway.getNowPlayingMovies();
      console.log(`   • Attempt #${i} finished in ${Date.now() - t0}ms (Returned ${movies.length} fallback movies)`);
    }

    const tmdbState = tmdbTestGateway.breaker.getState();
    console.log(`   Circuit State after failure burst: ${tmdbState}`);
    if (tmdbState !== CircuitState.OPEN) {
      throw new Error(`Expected TMDB circuit state to be OPEN, got ${tmdbState}`);
    }
    console.log("   ✓ TMDB Circuit Breaker successfully TRIPPED to OPEN!");

    // Test fast-fail fallback in OPEN state
    const tmdbFastStart = Date.now();
    const fallbackMovies = await tmdbTestGateway.getNowPlayingMovies();
    const tmdbFastDuration = Date.now() - tmdbFastStart;
    console.log(`   Fast-fail response time: ${tmdbFastDuration}ms (< 50ms expected)`);
    console.log(`   Fallback movies received: ${fallbackMovies.length} blockbusters`);
    if (tmdbFastDuration > 50 || fallbackMovies.length === 0) {
      throw new Error(`TMDB fast fallback failed or took too long: ${tmdbFastDuration}ms`);
    }
    console.log("   ✅ [TMDB MOVIE API] Circuit Breaker: VERIFIED STABLE & PROTECTED\n");

    console.log("================================================================================");
    console.log("🎉 ALL CIRCUIT BREAKERS ACROSS ALL EXTERNAL APIS ARE 100% OPERATIONAL!");
    console.log("================================================================================");
  } finally {
    chaosServer.close();
    delete process.env.BREVO_API_URL;
    delete process.env.BREVO_API_KEY;
    delete process.env.GOOGLE_OAUTH_URL;
    delete process.env.TMDB_API_URL;
    delete process.env.TMDB_API_KEY;
  }
}

runAllCircuitBreakerVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
