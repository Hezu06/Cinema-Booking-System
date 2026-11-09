/**
 * Cache Service Interface
 * Defines the contract for caching data across application services
 * in accordance with the Dependency Inversion Principle (DIP).
 */
export interface CacheService {
  /**
   * Retrieves a parsed JSON value from cache by key.
   * Returns null if key does not exist or if caching is unavailable.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Sets a value in cache serialized as JSON with an optional TTL (in seconds).
   * Default TTL is 300 seconds (5 minutes).
   */
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;

  /**
   * Deletes a specific key from cache.
   */
  del(key: string): Promise<void>;

  /**
   * Deletes all keys matching a given pattern (e.g., 'movies:*').
   * Uses SCAN under the hood to prevent blocking the Redis event loop.
   */
  delByPattern(pattern: string): Promise<void>;

  /**
   * Returns true if cache connection is active and ready.
   */
  isReady(): boolean;
}
