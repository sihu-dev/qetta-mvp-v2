/**
 * API Cache
 * In-memory cache with TTL for API responses
 */

import { metrics } from '@/lib/metrics';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheOptions {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Maximum number of entries */
  maxEntries: number;
  /** Cache name for metrics */
  name: string;
  /** Enable stale-while-revalidate */
  staleWhileRevalidate?: boolean;
  /** Stale TTL in ms (time after expiry that stale data is still returned) */
  staleTTL?: number;
}

const DEFAULT_OPTIONS: CacheOptions = {
  defaultTTL: 60000, // 1 minute
  maxEntries: 1000,
  name: 'api-cache',
  staleWhileRevalidate: false,
  staleTTL: 30000, // 30 seconds
};

export class APICache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly options: CacheOptions;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      metrics.cacheMiss(this.options.name);
      return undefined;
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      // Check if within stale window
      if (
        this.options.staleWhileRevalidate &&
        this.options.staleTTL &&
        now < entry.expiresAt + this.options.staleTTL
      ) {
        // Return stale value but mark as stale
        metrics.cacheHit(this.options.name);
        return entry.value;
      }

      // Expired and not within stale window
      this.cache.delete(key);
      metrics.cacheMiss(this.options.name);
      return undefined;
    }

    metrics.cacheHit(this.options.name);
    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Enforce max entries limit
    if (this.cache.size >= this.options.maxEntries) {
      this.evictOldest();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + (ttl ?? this.options.defaultTTL),
      createdAt: now,
    });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if a key exists (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get or set a value
   */
  async getOrSet(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (newestEntry === null || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Invalidate entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  /**
   * Evict the oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Create a cache key from request parameters
 */
export function createCacheKey(
  prefix: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join('&');

  return `${prefix}:${sortedParams}`;
}

// Pre-configured cache instances
export const caches = {
  /** Cache for bid data */
  bids: new APICache({
    name: 'bids',
    defaultTTL: 300000, // 5 minutes
    maxEntries: 500,
  }),

  /** Cache for evidence data */
  evidence: new APICache({
    name: 'evidence',
    defaultTTL: 600000, // 10 minutes
    maxEntries: 200,
  }),

  /** Cache for AGI insights */
  insights: new APICache({
    name: 'insights',
    defaultTTL: 60000, // 1 minute
    maxEntries: 100,
    staleWhileRevalidate: true,
    staleTTL: 30000,
  }),

  /** Cache for external API responses */
  external: new APICache({
    name: 'external',
    defaultTTL: 300000, // 5 minutes
    maxEntries: 200,
  }),
};

/**
 * Create a new cache instance
 */
export function createCache<T>(options: Partial<CacheOptions> = {}): APICache<T> {
  return new APICache<T>(options);
}
