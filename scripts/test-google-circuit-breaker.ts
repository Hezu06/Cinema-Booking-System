import http from "node:http";
import { GoogleOAuthGateway } from "../src/data-access/gateways/google-oauth.gateway.js";
import { CircuitState } from "../src/data-access/resilience/circuit-breaker.js";

async function runGoogleCircuitBreakerTest() {
  console.log("========================================================");
  console.log("🧪 TESTING GOOGLE OAUTH GATEWAY CIRCUIT BREAKER");
  console.log("========================================================");

  // 1. Setup local mock Google server that responds slowly (2000ms delay)
  const MOCK_PORT = 9988;
  const mockServer = http.createServer((req, res) => {
    setTimeout(() => {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "google_internal_error", error_description: "Google Server Down" }));
    }, 1500);
  });

  await new Promise<void>((resolve) => mockServer.listen(MOCK_PORT, resolve));
  process.env.GOOGLE_OAUTH_URL = `http://127.0.0.1:${MOCK_PORT}/tokeninfo`;

  try {
    const gateway = new GoogleOAuthGateway({
      name: "TestGoogleOAuthGateway",
      timeoutMs: 400, // Fast timeout for test
      volumeThreshold: 3,
      errorThresholdPercentage: 50,
      resetTimeoutMs: 2000,
    });

    console.log(`Initial state: ${gateway.breaker.getState()}`);
    if (gateway.breaker.getState() !== CircuitState.CLOSED) {
      throw new Error("Expected initial state to be CLOSED");
    }

    // 2. Demo token test (always succeeds via local bypass)
    console.log("\n1. Testing demo token bypass...");
    const demoPayload = await gateway.verifyIdToken("demo_google_token_developer");
    console.log("   Demo payload:", demoPayload.email);
    if (demoPayload.email !== "google.developer@example.com") {
      throw new Error("Demo token verification failed");
    }

    // 3. Fire real failing requests to trip the breaker
    console.log("\n2. Simulating Google service outages (tripping breaker)...");
    for (let i = 1; i <= 4; i++) {
      const start = Date.now();
      try {
        await gateway.verifyIdToken(`real_mock_jwt_token_part1.part2.part3_${i}`);
      } catch (err: any) {
        const elapsed = Date.now() - start;
        console.log(`   Req #${i}: Failed in ${elapsed}ms | Error: ${err.message?.slice(0, 50)}...`);
      }
    }

    const stateAfterFails = gateway.breaker.getState();
    console.log(`\nState after failure burst: ${stateAfterFails}`);
    if (stateAfterFails !== CircuitState.OPEN) {
      throw new Error(`Expected circuit state to be OPEN, got ${stateAfterFails}`);
    }
    console.log("   ✓ Circuit Breaker successfully TRIPPED to OPEN!");

    // 4. Test Fast-Fail in OPEN state (< 5ms response time)
    console.log("\n3. Testing Fast-Fail when Circuit Breaker is OPEN...");
    const fastFailStart = Date.now();
    try {
      await gateway.verifyIdToken("real_mock_jwt_token_part1.part2.part3_fastfail");
    } catch (err: any) {
      const fastFailElapsed = Date.now() - fastFailStart;
      console.log(`   Fast-fail response time: ${fastFailElapsed}ms`);
      console.log(`   Fast-fail error message: ${err.message}`);
      if (fastFailElapsed > 50) {
        throw new Error(`Fast-fail took too long: ${fastFailElapsed}ms (expected < 50ms)`);
      }
      if (!err.message.includes("Circuit Breaker OPEN")) {
        throw new Error("Expected Circuit Breaker OPEN fallback message");
      }
      console.log("   ✓ Fast-fail succeeded in < 50ms without waiting for external network timeout!");
    }

    console.log("\n========================================================");
    console.log("🎉 ALL GOOGLE OAUTH CIRCUIT BREAKER TESTS PASSED!");
    console.log("========================================================");
  } finally {
    mockServer.close();
    delete process.env.GOOGLE_OAUTH_URL;
  }
}

runGoogleCircuitBreakerTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
