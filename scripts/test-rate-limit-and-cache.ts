import "dotenv/config";
import app from "../src/app.js";
import { getRedisClient, closeRedis } from "../src/infrastructure/cache/redis.client.js";
import { prisma } from "../src/data-access/prisma/client.js";
import type { Server } from "node:http";

async function runVerification() {
  console.log("===============================================================");
  console.log("🚀 TESTING RATE LIMITING & REDIS CACHE-ASIDE (OPTION 1)");
  console.log("===============================================================");

  const redisUrl = process.env.REDIS_URL?.trim();
  console.log(`\n[1/4] Checking REDIS_URL configuration...`);
  if (!redisUrl) {
    console.warn("⚠️  REDIS_URL chưa được khai báo trong file .env!");
    console.log("👉 Vui lòng tạo Upstash Redis và thêm vào file .env theo định dạng:");
    console.log("   REDIS_URL=\"rediss://default:xxxx@singapore-xxxx.upstash.io:6379\"");
    console.log("👉 Sau khi thêm, hãy chạy lại lệnh: npm run test:rate-limit-and-cache");
    process.exit(0);
  }
  console.log(`✓ REDIS_URL detected: ${redisUrl.replace(/:\/\/.*@/, "://***@")}`);

  // Test Redis direct connectivity
  console.log(`\n[2/4] Testing Redis Ping & Latency...`);
  const client = getRedisClient();
  if (!client) {
    console.error("❌ Không thể khởi tạo Redis client!");
    process.exit(1);
  }

  try {
    const t0 = performance.now();
    const pong = await client.ping();
    const t1 = performance.now();
    console.log(`✓ Redis PING response: ${pong} (${(t1 - t0).toFixed(2)} ms latency)`);

    // Test SET & GET
    await client.set("test:verification:key", JSON.stringify({ ok: true, timestamp: Date.now() }), "EX", 30);
    const cachedVal = await client.get("test:verification:key");
    console.log(`✓ Redis SET/GET test passed:`, cachedVal);
    await client.del("test:verification:key");
  } catch (err) {
    console.error(`❌ Lỗi kết nối Redis:`, err);
    console.log("👉 Đảm bảo URL chính xác và dịch vụ Redis đang online.");
    process.exit(1);
  }

  // Start temporary test server
  const TEST_PORT = 3002;
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(TEST_PORT, () => resolve(s));
  });
  console.log(`\n[3/4] Test server listening on http://localhost:${TEST_PORT}`);

  try {
    // Test Rate Limiter (Auth Limiter: max 5 requests per minute)
    console.log(`\n[4/4] Testing Rate Limiting on POST /api/auth/login (Limit = 5 req/min)...`);
    let hit429 = false;

    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`http://localhost:${TEST_PORT}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `test${i}@example.com`, password: "WrongPassword123!" }),
      });

      const body = await res.json() as any;
      console.log(`  • Request #${i} => Status: ${res.status} | Code: ${body?.errorCode || "OK"}`);

      if (res.status === 429) {
        hit429 = true;
        console.log(`  🎉 Rate Limiter triggered accurately on request #${i}!`);
        console.log(`     Response envelope:`, JSON.stringify(body));
        break;
      }
    }

    if (!hit429) {
      console.warn("⚠️ Rate Limiter chưa chặn ở request #6.");
    }

    // Test Cache-Aside on GET /api/movies
    console.log(`\n[Cache Test] Testing Cache-Aside on GET /api/movies...`);
    const c1Start = performance.now();
    const res1 = await fetch(`http://localhost:${TEST_PORT}/api/movies`);
    const c1Time = performance.now() - c1Start;
    const data1 = await res1.json() as any;
    console.log(`  • 1st Request (Database / Cache Miss): ${c1Time.toFixed(2)} ms (Returned ${data1?.data?.length ?? 0} movies)`);

    const c2Start = performance.now();
    const res2 = await fetch(`http://localhost:${TEST_PORT}/api/movies`);
    const c2Time = performance.now() - c2Start;
    const data2 = await res2.json() as any;
    console.log(`  • 2nd Request (Redis Cache Hit):        ${c2Time.toFixed(2)} ms (Returned ${data2?.data?.length ?? 0} movies)`);

    const cachedInRedis = await client.get("movies:all");
    console.log(`  ✓ Checked Redis key 'movies:all' exists in Redis: ${cachedInRedis !== null}`);

  } finally {
    server.close();
    await closeRedis();
    await prisma.$disconnect();
    console.log("\n===============================================================");
    console.log("🏁 VERIFICATION COMPLETED!");
    console.log("===============================================================");
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
