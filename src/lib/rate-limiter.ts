/**
 * Rate Limiter
 * Token bucket algorithm for rate limiting
 */

import { metrics } from '@/lib/metrics';
import { RateLimitError } from '@/lib/resilience/errors';

export interface RateLimiterOptions {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Identifier name for metrics */
  name: string;
  /** Skip rate limiting for certain identifiers */
  skip?: (identifier: string) => boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_OPTIONS: RateLimiterOptions = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
  name: 'default',
};

export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private readonly options: RateLimiterOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.options.windowMs);
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(identifier: string): boolean {
    // Check if should skip
    if (this.options.skip?.(identifier)) {
      return true;
    }

    const now = Date.now();
    const entry = this.entries.get(identifier);

    // No existing entry or expired
    if (!entry || now > entry.resetAt) {
      this.entries.set(identifier, {
        count: 1,
        resetAt: now + this.options.windowMs,
      });
      return true;
    }

    // Check if within limit
    if (entry.count < this.options.maxRequests) {
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    metrics.rateLimitExceeded(identifier);
    return false;
  }

  /**
   * Check and throw if rate limited
   */
  check(identifier: string): void {
    if (!this.isAllowed(identifier)) {
      const entry = this.entries.get(identifier);
      const retryAfter = entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : undefined;
      throw new RateLimitError(
        `Rate limit exceeded for ${this.options.name}`,
        retryAfter
      );
    }
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.entries.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return this.options.maxRequests;
    }
    return Math.max(0, this.options.maxRequests - entry.count);
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.entries.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return null;
    }
    return entry.resetAt;
  }

  /**
   * Get rate limit headers for response
   */
  getHeaders(identifier: string): Record<string, string> {
    const entry = this.entries.get(identifier);
    const now = Date.now();

    if (!entry || now > entry.resetAt) {
      return {
        'X-RateLimit-Limit': String(this.options.maxRequests),
        'X-RateLimit-Remaining': String(this.options.maxRequests),
        'X-RateLimit-Reset': String(Math.ceil((now + this.options.windowMs) / 1000)),
      };
    }

    return {
      'X-RateLimit-Limit': String(this.options.maxRequests),
      'X-RateLimit-Remaining': String(Math.max(0, this.options.maxRequests - entry.count)),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.entries.delete(identifier);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries.entries()) {
      if (now > entry.resetAt) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeEntries: number;
    totalRequests: number;
  } {
    let totalRequests = 0;
    for (const entry of this.entries.values()) {
      totalRequests += entry.count;
    }
    return {
      activeEntries: this.entries.size,
      totalRequests,
    };
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  /** General API rate limiter */
  api: new RateLimiter({
    name: 'api',
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
  }),

  /** Authentication rate limiter (stricter) */
  auth: new RateLimiter({
    name: 'auth',
    maxRequests: 10,
    windowMs: 60000, // 10 attempts per minute
  }),

  /** AI/Claude API rate limiter */
  ai: new RateLimiter({
    name: 'ai',
    maxRequests: 20,
    windowMs: 60000, // 20 requests per minute
  }),

  /** File upload rate limiter */
  upload: new RateLimiter({
    name: 'upload',
    maxRequests: 10,
    windowMs: 60000, // 10 uploads per minute
  }),
};

/**
 * Create a new rate limiter
 */
export function createRateLimiter(options: Partial<RateLimiterOptions> = {}): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get from headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a hash of user-agent + other headers
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent.substring(0, 50)}`;
}
