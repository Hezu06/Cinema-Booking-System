import type { CacheService } from "../../business/interfaces/cache.interface.js";
import { getRedisClient } from "./redis.client.js";

/**
 * Concrete CacheService implementation backed by Redis (ioredis).
 * Implements the Cache-Aside pattern with resilient error handling:
 * if Redis is unavailable or throws, operations log the error and
 * gracefully fallback (return null / no-op) so core database reads/writes succeed.
 */
export class RedisCacheService implements CacheService {
  private readonly defaultTtlSeconds = 300; // 5 minutes

  isReady(): boolean {
    const client = getRedisClient();
    return client !== null && client.status === "ready";
  }

  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) {
      return null;
    }

    try {
      const data = await client.get(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (err) {
      console.error(
        `[RedisCacheService] ❌ Failed to read key "${key}":`,
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<void> {
    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await client.set(key, serialized);
      }
    } catch (err) {
      console.error(
        `[RedisCacheService] ❌ Failed to write key "${key}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch (err) {
      console.error(
        `[RedisCacheService] ❌ Failed to delete key "${key}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) {
      return;
    }

    try {
      let cursor = "0";
      do {
        // SCAN 0 MATCH pattern COUNT 100
        const [nextCursor, keys] = await client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      console.error(
        `[RedisCacheService] ❌ Failed to delete pattern "${pattern}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}
