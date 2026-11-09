import { Redis } from "ioredis";

let redisClient: Redis | null = null;
let hasLoggedMissingEnv = false;

/**
 * Returns the singleton ioredis client instance.
 * If REDIS_URL is not configured, returns null and logs an informative warning once.
 */
export function getRedisClient(): Redis | null {
  let redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) {
    if (!hasLoggedMissingEnv) {
      console.warn(
        "[Redis] ⚠️ REDIS_URL is not set in environment. Real Redis connection is disabled (cache bypass).",
      );
      hasLoggedMissingEnv = true;
    }
    return null;
  }

  // Automatically enforce rediss:// TLS for Upstash Cloud endpoints if user provided redis://
  if (redisUrl.startsWith("redis://") && redisUrl.includes("upstash.io")) {
    redisUrl = "rediss://" + redisUrl.slice("redis://".length);
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy(times) {
          const delay = Math.min(times * 200, 3000);
          return delay;
        },
      });

      redisClient.on("connect", () => {
        console.log("[Redis] 🔌 Connecting to Redis server...");
      });

      redisClient.on("ready", () => {
        console.log("[Redis] ✅ Redis connection established and ready.");
      });

      redisClient.on("error", (err: Error) => {
        console.error(`[Redis] ❌ Redis client error: ${err.message}`);
      });

      redisClient.on("close", () => {
        console.warn("[Redis] ⚠️ Redis connection closed.");
      });

      redisClient.on("reconnecting", (delay: number) => {
        console.log(`[Redis] 🔄 Reconnecting to Redis in ${delay}ms...`);
      });
    } catch (err) {
      console.error(
        "[Redis] ❌ Failed to initialize Redis client:",
        err instanceof Error ? err.message : err,
      );
      redisClient = null;
    }
  }

  return redisClient;
}

/**
 * Gracefully closes the Redis connection during server shutdown.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log("[Redis] 🔌 Redis connection closed cleanly.");
    } catch (err) {
      console.error("[Redis] ❌ Error during Redis disconnect:", err);
    } finally {
      redisClient = null;
    }
  }
}
