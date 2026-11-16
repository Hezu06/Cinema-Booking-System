import "dotenv/config";
import type { Server } from "node:http";
import { performance } from "node:perf_hooks";
import app from "../src/app.js";
import { throttlingMiddleware } from "../src/api/middlewares/throttling.middleware.js";
import { closeRedis } from "../src/infrastructure/cache/redis.client.js";
import { prisma } from "../src/data-access/prisma/client.js";

export interface BenchmarkMetrics {
  scenarioName: string;
  totalRequests: number;
  concurrency: number;
  durationMs: number;
  rps: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  statusCodes: Record<number, number>;
  errorCodes: Record<string, number>;
  successRate: number;
  throttledRate: number;
  rateLimitedRate: number;
}

interface RunOptions {
  name: string;
  epochNum: number;
  totalEpochs: number;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  concurrency: number;
  totalRequests: number;
}

function renderKaggleProgressBar(
  current: number,
  total: number,
  startTime: number,
  ok: number,
  throttled: number,
  blocked: number,
  errorCount: number,
) {
  const elapsedSec = (performance.now() - startTime) / 1000;
  const currentRps = elapsedSec > 0 ? (current / elapsedSec).toFixed(1) : "0.0";
  const percent = Math.floor((current / total) * 100);
  const barWidth = 24;
  const filled = Math.floor((current / total) * barWidth);
  const empty = barWidth - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  const padCur = String(current).padStart(String(total).length, " ");
  const msPerStep = current > 0 ? ((elapsedSec * 1000) / current).toFixed(0) : "0";

  let statusStr = `\x1b[32mOK:${ok}\x1b[0m`;
  if (throttled > 0) statusStr += ` | \x1b[33m503:${throttled}\x1b[0m`;
  if (blocked > 0) statusStr += ` | \x1b[35m429:${blocked}\x1b[0m`;
  if (errorCount > 0) statusStr += ` | \x1b[31mErr:${errorCount}\x1b[0m`;

  const line = `  [${bar}] ${String(percent).padStart(3, " ")}% | ${padCur}/${total} [${elapsedSec.toFixed(1)}s, ${msPerStep}ms/req, ${currentRps} rps] | ${statusStr}`;
  process.stdout.write(`\r${line}`);
}

async function executeBenchmark(options: RunOptions): Promise<BenchmarkMetrics> {
  const {
    name,
    epochNum,
    totalEpochs,
    url,
    method = "GET",
    headers = {},
    body,
    concurrency,
    totalRequests,
  } = options;

  console.log(`\n\x1b[1m\x1b[36mEpoch ${epochNum}/${totalEpochs}\x1b[0m - \x1b[1m${name}\x1b[0m`);
  console.log(`Target: \x1b[90m${method} ${url} | Concurrency: ${concurrency} users | Total: ${totalRequests} reqs\x1b[0m`);

  const latencies: number[] = [];
  const statusCodes: Record<number, number> = {};
  const errorCodes: Record<string, number> = {};

  let requestCounter = 0;
  let completedCounter = 0;
  const startTime = performance.now();

  async function worker(workerId: number) {
    const clientIp = `198.51.100.${workerId + 1}`;
    while (true) {
      const currentReqIndex = ++requestCounter;
      if (currentReqIndex > totalRequests) {
        break;
      }

      const reqStart = performance.now();
      try {
        const reqHeaders: Record<string, string> = {
          "x-forwarded-for": clientIp,
          ...headers,
        };
        const res = await fetch(url, {
          method,
          headers: reqHeaders,
          body,
        });

        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);
        statusCodes[res.status] = (statusCodes[res.status] || 0) + 1;

        if (res.status >= 400) {
          try {
            const data = (await res.json()) as any;
            if (data?.errorCode) {
              errorCodes[data.errorCode] = (errorCodes[data.errorCode] || 0) + 1;
            }
          } catch {
            // non-json
          }
        }
      } catch (err) {
        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);
        statusCodes[500] = (statusCodes[500] || 0) + 1;
        errorCodes["FETCH_ERROR"] = (errorCodes["FETCH_ERROR"] || 0) + 1;
      } finally {
        completedCounter++;
        const ok = (statusCodes[200] || 0) + (statusCodes[201] || 0);
        const th = statusCodes[503] || 0;
        const rl = statusCodes[429] || 0;
        const errs = statusCodes[500] || 0;
        renderKaggleProgressBar(completedCounter, totalRequests, startTime, ok, th, rl, errs);
      }
    }
  }

  // Spawn concurrency worker pool
  const workerCount = Math.min(concurrency, totalRequests);
  const workers = Array.from({ length: workerCount }).map((_, idx) => worker(idx));
  await Promise.all(workers);

  // New line after progress bar finishes
  process.stdout.write("\n");

  const durationMs = performance.now() - startTime;
  latencies.sort((a, b) => a - b);

  const sumLatency = latencies.reduce((sum, val) => sum + val, 0);
  const avgLatencyMs = latencies.length > 0 ? sumLatency / latencies.length : 0;
  const minLatencyMs = latencies[0] ?? 0;
  const maxLatencyMs = latencies[latencies.length - 1] ?? 0;

  const getPercentile = (p: number) => {
    if (latencies.length === 0) return 0;
    const index = Math.min(Math.floor(latencies.length * p), latencies.length - 1);
    return latencies[index] ?? 0;
  };

  const p50LatencyMs = getPercentile(0.5);
  const p90LatencyMs = getPercentile(0.9);
  const p95LatencyMs = getPercentile(0.95);
  const p99LatencyMs = getPercentile(0.99);

  const rps = durationMs > 0 ? (totalRequests / (durationMs / 1000)) : 0;
  const okCount = (statusCodes[200] || 0) + (statusCodes[201] || 0);
  const throttledCount = statusCodes[503] || 0;
  const rateLimitedCount = statusCodes[429] || 0;

  const successRate = (okCount / totalRequests) * 100;
  const throttledRate = (throttledCount / totalRequests) * 100;
  const rateLimitedRate = (rateLimitedCount / totalRequests) * 100;

  // Print Kaggle-Style Latency Histogram Chart
  console.log("  \x1b[90m📊 Latency Distribution:\x1b[0m");
  const buckets = [
    { label: "< 50ms   ", count: latencies.filter((l) => l < 50).length },
    { label: "50-150ms ", count: latencies.filter((l) => l >= 50 && l < 150).length },
    { label: "150-300ms", count: latencies.filter((l) => l >= 150 && l < 300).length },
    { label: "> 300ms  ", count: latencies.filter((l) => l >= 300).length },
  ];
  buckets.forEach((b) => {
    const pct = totalRequests > 0 ? Math.round((b.count / totalRequests) * 100) : 0;
    const barLen = Math.round(pct / 4);
    const bar = "█".repeat(barLen) + " ".repeat(25 - barLen);
    console.log(`     \x1b[33m${b.label}\x1b[0m | [${bar}] ${String(pct).padStart(3, " ")}% (${b.count} reqs)`);
  });

  return {
    scenarioName: name,
    totalRequests,
    concurrency,
    durationMs,
    rps,
    minLatencyMs,
    maxLatencyMs,
    avgLatencyMs,
    p50LatencyMs,
    p90LatencyMs,
    p95LatencyMs,
    p99LatencyMs,
    statusCodes,
    errorCodes,
    successRate,
    throttledRate,
    rateLimitedRate,
  };
}

async function runBenchmarkSuite() {
  const targetArg = process.argv.find((a) => a.startsWith("--target="))?.split("=")[1]?.trim();
  const targetUrl = targetArg || process.env.BENCHMARK_TARGET_URL?.trim();
  const isRemote = Boolean(targetUrl && targetUrl.startsWith("http"));

  console.log("==================================================================");
  console.log("📊 CBS PHASE 2: REAL-TIME LOAD BENCHMARK SUITE (KAGGLE RUNNER)");
  if (isRemote) {
    console.log(`🌐 TARGET: LIVE CLOUD PRODUCTION SERVER -> ${targetUrl}`);
  } else {
    console.log("💻 TARGET: LOCAL EXPRESS INTEGRATION ENGINE");
  }
  console.log("==================================================================");

  let server: Server | null = null;
  let baseUrl: string;

  if (isRemote) {
    baseUrl = targetUrl!.replace(/\/$/, "");
    console.log(`\n🔗 Connecting directly to remote cloud instance at: ${baseUrl}`);
  } else {
    const PORT = 3010;
    console.log(`\n🚀 Initializing production Express app on port ${PORT}...`);
    server = await new Promise((resolve) => {
      const s = app.listen(PORT, () => resolve(s));
    });
    console.log("  ✓ Real Express app listening with full Ingress pipeline.");
    baseUrl = `http://localhost:${PORT}`;
  }

  const allResults: BenchmarkMetrics[] = [];
  const TOTAL_EPOCHS = 5;

  try {
    // ------------------------------------------------------------------
    // EPOCH 1: Normal Load (Baseline cache & DB read latency)
    // ------------------------------------------------------------------
    if (!isRemote) {
      throttlingMiddleware.updateOptions({
        maxConcurrentRequests: 100,
        maxQueueSize: 50,
        queueTimeoutMs: 2000,
      });
    }

    const s1 = await executeBenchmark({
      name: "Normal Daytime Load (10 Users lướt xem phim)",
      epochNum: 1,
      totalEpochs: TOTAL_EPOCHS,
      url: `${baseUrl}/api/movies`,
      concurrency: 10,
      totalRequests: isRemote ? 40 : 100,
    });
    allResults.push(s1);

    await new Promise((r) => setTimeout(r, 600));

    // ------------------------------------------------------------------
    // EPOCH 2: Nominal Steady State (30 concurrent users)
    // ------------------------------------------------------------------
    const s2 = await executeBenchmark({
      name: "Weekend Peak Capacity (30 Users đặt vé liên tục)",
      epochNum: 2,
      totalEpochs: TOTAL_EPOCHS,
      url: `${baseUrl}/api/movies`,
      concurrency: isRemote ? 20 : 30,
      totalRequests: isRemote ? 80 : 300,
    });
    allResults.push(s2);

    await new Promise((r) => setTimeout(r, 600));

    // ------------------------------------------------------------------
    // EPOCH 3: Extreme Spike Overload (Testing L3 Backpressure & 503)
    // ------------------------------------------------------------------
    if (!isRemote) {
      throttlingMiddleware.updateOptions({
        maxConcurrentRequests: 15,
        maxQueueSize: 15,
        queueTimeoutMs: 1000,
      });
    }

    const s3 = await executeBenchmark({
      name: isRemote
        ? "Cloud Stress Burst (40 Concurrent Users)"
        : "Flash Sale Spike Overload (80 Users F5 cùng lúc)",
      epochNum: 3,
      totalEpochs: TOTAL_EPOCHS,
      url: `${baseUrl}/api/movies`,
      concurrency: isRemote ? 40 : 80,
      totalRequests: isRemote ? 120 : 240,
    });
    allResults.push(s3);

    // ------------------------------------------------------------------
    // EPOCH 4: VNPAY Webhook VIP Bypass under Overload
    // ------------------------------------------------------------------
    const s4 = await executeBenchmark({
      name: "VNPAY Webhook VIP Priority (Bypass giữa bão nghẽn)",
      epochNum: 4,
      totalEpochs: TOTAL_EPOCHS,
      url: `${baseUrl}/api/payments/vnpay/ipn`,
      concurrency: 5,
      totalRequests: 5,
    });
    allResults.push(s4);

    await new Promise((r) => setTimeout(r, 600));

    // ------------------------------------------------------------------
    // EPOCH 5: Authentication Rate Limiter (Brute-force Shield)
    // ------------------------------------------------------------------
    const s5 = await executeBenchmark({
      name: "Auth Bot Brute-force Defense (Spam 8 reqs liên tục)",
      epochNum: 5,
      totalEpochs: TOTAL_EPOCHS,
      url: `${baseUrl}/api/auth/login`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.99",
      },
      body: JSON.stringify({ email: "benchmark-test@example.com", password: "wrong-password" }),
      concurrency: 1,
      totalRequests: 8,
    });
    allResults.push(s5);

    // ------------------------------------------------------------------
    // FINAL SUMMARY TABLE
    // ------------------------------------------------------------------
    console.log("\n==================================================================");
    console.log("🏁 CBS PHASE 2: FINAL BENCHMARK SUMMARY (G6 - HIẾU)");
    console.log("==================================================================");

    console.log("\n| Kịch bản | Reqs | CC | RPS | p50 (ms) | p95 (ms) | 200 OK | 503 Throttled | 429 Blocked |");
    console.log("| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |");

    allResults.forEach((r) => {
      const ok = (r.statusCodes[200] || 0) + (r.statusCodes[201] || 0) + (r.statusCodes[401] || 0);
      const th = r.statusCodes[503] || 0;
      const rl = r.statusCodes[429] || 0;
      console.log(
        `| **${r.scenarioName.slice(0, 32)}** | ${r.totalRequests} | ${r.concurrency} | **${r.rps.toFixed(1)}** | ${r.p50LatencyMs.toFixed(1)} | ${r.p95LatencyMs.toFixed(1)} | ${ok} (${r.successRate.toFixed(0)}%) | ${th} (${r.throttledRate.toFixed(0)}%) | ${rl} (${r.rateLimitedRate.toFixed(0)}%) |`,
      );
    });

    console.log("\n==================================================================\n");
  } finally {
    if (!isRemote) {
      throttlingMiddleware.updateOptions({
        maxConcurrentRequests: 100,
        maxQueueSize: 50,
        queueTimeoutMs: 2000,
      });
    }

    if (server) {
      console.log("🧹 Tearing down local server and database connections...");
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    await closeRedis();
    await prisma.$disconnect();
    console.log("✓ Teardown completed cleanly.");
  }
}

runBenchmarkSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Benchmark failed with error:", err);
    process.exit(1);
  });
