import "dotenv/config";
import express from "express";
import type { Server } from "node:http";
import app from "../src/app.js";
import {
  gatekeeperMiddleware,
  normalizeClientIp,
} from "../src/api/middlewares/gatekeeper.middleware.js";
import {
  createThrottlingMiddleware,
} from "../src/api/middlewares/throttling.middleware.js";

async function runTests() {
  console.log("===============================================================");
  console.log("🛡️ TESTING INGRESS GATEKEEPER & THROTTLING PIPELINE (HIẾU)");
  console.log("===============================================================");

  // -------------------------------------------------------------
  // TEST 1: IP Normalization & Header Sanitization
  // -------------------------------------------------------------
  console.log("\n[1/4] Testing IP Normalization unit logic...");
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
  console.log("  ✓ IP Normalization tests passed perfectly.");

  // -------------------------------------------------------------
  // TEST 2: Gatekeeper Secret Enforcement (Proxy Protection)
  // -------------------------------------------------------------
  console.log("\n[2/4] Testing Gatekeeper Secret Enforcement...");
  const testApp = express();
  testApp.set("trust proxy", 1);
  testApp.use(gatekeeperMiddleware);
  testApp.get("/test-target", (req, res) => {
    res.json({
      success: true,
      clientIp: (req as any).clientIp,
      forbiddenHeaderPresent: "x-internal-secret" in req.headers,
    });
  });

  const PORT_GATEKEEPER = 3005;
  const s1: Server = await new Promise((r) => {
    const s = testApp.listen(PORT_GATEKEEPER, () => r(s));
  });

  try {
    // 2.1 Test header sanitization (strip forbidden header)
    const resSanitize = await fetch(`http://localhost:${PORT_GATEKEEPER}/test-target`, {
      headers: {
        "x-internal-secret": "hacker-value",
        "x-gatekeeper-bypass": "true",
      },
    });
    const bodySanitize = (await resSanitize.json()) as any;
    console.log(`  • Header sanitization check: forbiddenHeaderPresent = ${bodySanitize.forbiddenHeaderPresent}`);
    if (bodySanitize.forbiddenHeaderPresent !== false) {
      throw new Error("❌ Gatekeeper failed to strip forbidden internal headers!");
    }
    console.log("  ✓ Spoofed internal headers successfully stripped.");

    // 2.2 Test secret enforcement when GATEKEEPER_SECRET is set
    process.env.GATEKEEPER_SECRET = "super-secret-gatekeeper-token";

    // Request without secret -> Expect 403
    const resBlocked = await fetch(`http://localhost:${PORT_GATEKEEPER}/test-target`);
    const bodyBlocked = (await resBlocked.json()) as any;
    console.log(`  • Direct access without secret => Status: ${resBlocked.status} (Code: ${bodyBlocked.errorCode})`);
    if (resBlocked.status !== 403 || bodyBlocked.errorCode !== "GATEKEEPER_ACCESS_DENIED") {
      throw new Error("❌ Gatekeeper failed to block unauthenticated direct request!");
    }

    // Request with valid secret -> Expect 200
    const resAllowed = await fetch(`http://localhost:${PORT_GATEKEEPER}/test-target`, {
      headers: { "x-gatekeeper-secret": "super-secret-gatekeeper-token" },
    });
    console.log(`  • Authorized access via Gatekeeper => Status: ${resAllowed.status}`);
    if (resAllowed.status !== 200) {
      throw new Error("❌ Gatekeeper blocked request with valid secret!");
    }
    console.log("  ✓ Gatekeeper proxy secret enforcement verified.");
  } finally {
    delete process.env.GATEKEEPER_SECRET;
    s1.close();
  }

  // -------------------------------------------------------------
  // TEST 3 & 4: Throttling Bounded Queue & VNPAY Exemption
  // -------------------------------------------------------------
  console.log("\n[3/4] Testing Throttling Concurrency & Bounded Queue (Max: 2 concurrent, Queue: 2)...");
  const throttledApp = express();
  throttledApp.set("trust proxy", 1);

  // Tight throttling config for deterministic testing
  const customThrottler = createThrottlingMiddleware({
    maxConcurrentRequests: 2,
    maxQueueSize: 2,
    queueTimeoutMs: 1500,
  });

  throttledApp.use(customThrottler);

  // Slow endpoint: takes 200ms
  throttledApp.get("/slow-work", async (_req, res) => {
    await new Promise((r) => setTimeout(r, 200));
    res.json({ success: true, message: "slow work completed" });
  });

  // VNPAY callback endpoint (must bypass throttling)
  throttledApp.get("/api/payments/vnpay/ipn", (_req, res) => {
    res.json({ RspCode: "00", Message: "Confirm Success" });
  });

  const PORT_THROTTLE = 3006;
  const s2: Server = await new Promise((r) => {
    const s = throttledApp.listen(PORT_THROTTLE, () => r(s));
  });

  try {
    // Fire 6 simultaneous requests to /slow-work
    // Capacity: 2 active + 2 queue = 4 accommodated; 2 should receive 503 SERVICE_THROTTLED
    console.log("  • Firing 6 parallel requests to /slow-work...");
    const promises = Array.from({ length: 6 }).map((_, i) =>
      fetch(`http://localhost:${PORT_THROTTLE}/slow-work`).then(async (res) => ({
        index: i + 1,
        status: res.status,
        body: (await res.json().catch(() => ({}))) as any,
        retryAfter: res.headers.get("retry-after"),
      })),
    );

    // Concurrently fire a VNPAY IPN webhook during the spike
    console.log("\n[4/4] Testing VNPAY Webhook VIP Bypass during heavy spike...");
    const vnpayPromise = fetch(`http://localhost:${PORT_THROTTLE}/api/payments/vnpay/ipn`).then(
      async (res) => ({
        endpoint: "/api/payments/vnpay/ipn",
        status: res.status,
        body: (await res.json()) as any,
      }),
    );

    const [vnpayResult, results] = await Promise.all([
      vnpayPromise,
      Promise.all(promises),
    ]);

    const statusCounts = results.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    console.log(`  • In-flight Request Results breakdown:`, statusCounts);
    results.forEach((r) => {
      console.log(`    - Req #${r.index} => Status ${r.status}${r.status === 503 ? ` (Retry-After: ${r.retryAfter}s, Code: ${r.body?.errorCode})` : " (OK)"}`);
    });

    if (!statusCounts[503] || statusCounts[503] < 1) {
      throw new Error("❌ Throttling failed to reject requests exceeding queue capacity!");
    }
    console.log("  ✓ Throttling backpressure successfully rejected surplus requests with HTTP 503.");

    console.log(`  • VNPAY Webhook Result: Status ${vnpayResult.status} | Code: ${vnpayResult.body?.RspCode}`);
    if (vnpayResult.status !== 200 || vnpayResult.body?.RspCode !== "00") {
      throw new Error("❌ VNPAY IPN webhook was incorrectly blocked or throttled!");
    }
    console.log("  🎉 VNPAY Webhook successfully BYPASSED throttling queue even under heavy load!");
  } finally {
    s2.close();
  }

  console.log("\n===============================================================");
  console.log("🏁 ALL INGRESS GATEKEEPER & THROTTLING TESTS PASSED (100%)");
  console.log("===============================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
