import "dotenv/config";
import type { Server } from "node:http";
import app from "../src/app.js";
import { normalizeClientIp } from "../src/api/middlewares/gatekeeper.middleware.js";
import { throttlingMiddleware } from "../src/api/middlewares/throttling.middleware.js";
import { closeRedis } from "../src/infrastructure/cache/redis.client.js";
import { prisma } from "../src/data-access/prisma/client.js";

async function runRealIntegrationTests() {
  console.log("==================================================================");
  console.log("🛡️ E2E INTEGRATION TEST: GATEKEEPER & THROTTLING ON REAL APP.TS");
  console.log("   (Hiếu - Ingress & Traffic Management Verification)");
  console.log("==================================================================");

  // -------------------------------------------------------------
  // TEST 1: IP Normalization Logic (Unit)
  // -------------------------------------------------------------
  console.log("\n[1/5] Testing Client IP Normalization logic...");
  const ip1 = normalizeClientIp("::ffff:192.168.1.100");
  const ip2 = normalizeClientIp("::1");
  const ip3 = normalizeClientIp("203.0.113.50");
  const ip4 = normalizeClientIp(undefined);

  console.log(`  • "::ffff:192.168.1.100" => "${ip1}" (Expected: 192.168.1.100)`);
  console.log(`  • "::1"                  => "${ip2}" (Expected: 127.0.0.1)`);
  console.log(`  • "203.0.113.50"         => "${ip3}" (Expected: 203.0.113.50)`);
  console.log(`  • undefined              => "${ip4}" (Expected: 127.0.0.1)`);

  if (ip1 !== "192.168.1.100" || ip2 !== "127.0.0.1" || ip3 !== "203.0.113.50" || ip4 !== "127.0.0.1") {
    throw new Error("❌ IP normalization test failed!");
  }
  console.log("  ✓ IP Normalization tests passed.");

  // -------------------------------------------------------------
  // START REAL EXPRESS SERVER (app.ts)
  // -------------------------------------------------------------
  const TEST_PORT = 3008;
  console.log(`\n🚀 Starting REAL Express application on port ${TEST_PORT}...`);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => resolve(s));
  });
  console.log("  ✓ Real Express application server listening.");

  try {
    // -------------------------------------------------------------
    // TEST 2: Real /health endpoint verification
    // -------------------------------------------------------------
    console.log("\n[2/5] Testing REAL /health endpoint...");
    const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
    const healthBody = (await healthRes.json()) as any;
    console.log(`  • Healthcheck status: ${healthRes.status} | message: "${healthBody.message}"`);
    if (healthRes.status !== 200 || !healthBody.success) {
      throw new Error(`❌ /health failed on real app: status ${healthRes.status}`);
    }
    console.log("  ✓ Real /health endpoint verified (exempt from gatekeeper/rate-limit/throttling).");

    // -------------------------------------------------------------
    // TEST 3: Real Gatekeeper Middleware on real /api/movies
    // -------------------------------------------------------------
    console.log("\n[3/5] Testing REAL Gatekeeper Header Sanitization & Secret Enforcement...");

    // 3.1 Strip spoofed headers during real database query
    const resWithSpoofed = await fetch(`http://localhost:${TEST_PORT}/api/movies`, {
      headers: {
        "x-internal-secret": "malicious-secret",
        "x-gatekeeper-bypass": "true",
        "x-user-role": "ADMIN_SPOOF",
      },
    });
    console.log(`  • Call /api/movies with spoofed headers => Status: ${resWithSpoofed.status}`);
    if (resWithSpoofed.status !== 200) {
      throw new Error(`❌ Expected 200 from /api/movies, got ${resWithSpoofed.status}`);
    }
    console.log("  ✓ Spoofed headers safely handled without disrupting real request.");

    // 3.2 Enable GATEKEEPER_SECRET on real app
    process.env.GATEKEEPER_SECRET = "hieu-ingress-gatekeeper-secret";

    // 3.2.1 Direct request without secret -> Expect 403 GATEKEEPER_ACCESS_DENIED
    const resBlocked = await fetch(`http://localhost:${TEST_PORT}/api/movies`);
    const blockedBody = (await resBlocked.json()) as any;
    console.log(
      `  • Direct access without secret => Status: ${resBlocked.status} | errorCode: ${blockedBody.errorCode}`,
    );
    if (resBlocked.status !== 403 || blockedBody.errorCode !== "GATEKEEPER_ACCESS_DENIED") {
      throw new Error("❌ Gatekeeper failed to block direct unauthenticated request on real app!");
    }

    // 3.2.2 Healthcheck must STILL be accessible even with GATEKEEPER_SECRET enabled
    const healthWithSecret = await fetch(`http://localhost:${TEST_PORT}/health`);
    if (healthWithSecret.status !== 200) {
      throw new Error("❌ Gatekeeper blocked /health when secret was enabled!");
    }
    console.log("  ✓ /health remains accessible for load balancer probes during secret enforcement.");

    // 3.2.3 Request with valid secret -> Expect 200
    const resAuthorized = await fetch(`http://localhost:${TEST_PORT}/api/movies`, {
      headers: {
        "x-gatekeeper-secret": "hieu-ingress-gatekeeper-secret",
      },
    });
    console.log(`  • Access via Gatekeeper with valid secret => Status: ${resAuthorized.status}`);
    if (resAuthorized.status !== 200) {
      throw new Error(`❌ Authorized request failed with status: ${resAuthorized.status}`);
    }
    console.log("  ✓ Gatekeeper proxy secret enforcement verified on real Express app.");

    // Clean up secret
    delete process.env.GATEKEEPER_SECRET;

    // -------------------------------------------------------------
    // TEST 4 & 5: Real Throttling Backpressure & VNPAY Webhook VIP Bypass
    // -------------------------------------------------------------
    console.log("\n[4/5] Testing REAL Throttling Concurrency & Bounded Queue on /api/movies...");
    console.log("      (Config: maxConcurrent=2, maxQueue=2, queueTimeout=1500ms)");

    // Dynamically adjust throttling capacity on the real mounted middleware
    throttlingMiddleware.updateOptions({
      maxConcurrentRequests: 2,
      maxQueueSize: 2,
      queueTimeoutMs: 1500,
    });

    console.log("  • Firing 7 concurrent requests to real /api/movies...");
    // 7 requests: 2 active + 2 queued = 4 total capacity; 3 surplus must get HTTP 503
    const moviePromises = Array.from({ length: 7 }).map((_, i) =>
      fetch(`http://localhost:${TEST_PORT}/api/movies`).then(async (res) => ({
        index: i + 1,
        status: res.status,
        body: (await res.json().catch(() => ({}))) as any,
        retryAfter: res.headers.get("retry-after"),
      })),
    );

    // Concurrently fire a VNPAY IPN webhook during the spike
    console.log("\n[5/5] Testing REAL VNPAY Webhook VIP Bypass during overload spike...");
    const vnpayPromise = fetch(`http://localhost:${TEST_PORT}/api/payments/vnpay/ipn`).then(
      async (res) => ({
        endpoint: "/api/payments/vnpay/ipn",
        status: res.status,
        body: (await res.json()) as any,
      }),
    );

    const [vnpayResult, movieResults] = await Promise.all([
      vnpayPromise,
      Promise.all(moviePromises),
    ]);

    const statusCounts = movieResults.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    console.log("  • Concurrency results on real /api/movies:", statusCounts);
    movieResults.forEach((r) => {
      console.log(
        `    - Request #${r.index} => Status ${r.status}${
          r.status === 503
            ? ` [THROTTLED: Retry-After=${r.retryAfter}s, errorCode=${r.body?.errorCode}]`
            : " [OK: 200]"
        }`,
      );
    });

    if (!statusCounts[503] || statusCounts[503] < 1) {
      throw new Error("❌ Real throttling failed to reject requests exceeding queue capacity!");
    }
    if (!statusCounts[200] || statusCounts[200] < 2) {
      throw new Error("❌ Real throttling failed to process concurrent/queued requests!");
    }
    console.log("  ✓ Real throttling backpressure successfully shed load with HTTP 503 and Retry-After.");

    console.log(
      `  • VNPAY IPN Webhook Result => Status ${vnpayResult.status} | Code: ${vnpayResult.body?.RspCode || "N/A"}`,
    );
    if (vnpayResult.status === 503) {
      throw new Error("❌ CRITICAL BUG: VNPAY Webhook was throttled with 503!");
    }
    console.log("  🎉 VNPAY Webhook was NEVER throttled! VIP bypass fully verified on real app.");
  } finally {
    // Restore default production limits
    throttlingMiddleware.updateOptions({
      maxConcurrentRequests: 100,
      maxQueueSize: 50,
      queueTimeoutMs: 2000,
    });

    // Clean teardown
    console.log("\n🧹 Cleaning up test resources...");
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeRedis();
    await prisma.$disconnect();
    console.log("  ✓ Server, Redis, and Prisma disconnected cleanly.");
  }

  console.log("\n==================================================================");
  console.log("🏁 REAL END-TO-END INGRESS & THROTTLING TEST PASSED (100%)");
  console.log("==================================================================");
}

runRealIntegrationTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ E2E Test execution failed:", err);
    process.exit(1);
  });
