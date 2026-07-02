import type { RateLimitConfig, RateLimitResult, RateLimitStore } from './types';

export class RateLimiter {
  private store: RateLimitStore;
  private config: RateLimitConfig;
  private prefix: string;

  /**
   * Initialize a rate limiter.
   * @param store The storage backend to use (must be injected).
   * @param config The rate limit configuration (windowMs, maxRequests)
   * @param prefix Optional prefix to namespace keys (e.g. 'login', 'crud')
   */
  constructor(store: RateLimitStore, config: RateLimitConfig, prefix: string = 'ratelimit') {
    this.store = store;
    this.config = config;
    this.prefix = prefix;
  }

  private getKey(identifier: string): string {
    return `${this.prefix}:${identifier}`;
  }

  /**
   * Consumes 1 point for the given identifier. 
   * Returns whether the request is allowed.
   */
  async consume(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const record = await this.store.increment(key, this.config.windowMs);

    const success = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      resetTime: record.resetTime,
    };
  }

  /**
   * Checks the current limit status for the given identifier without consuming a point.
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const record = await this.store.get(key);

    if (!record) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs, // estimate
      };
    }

    const success = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);

    return {
      success,
      limit: this.config.maxRequests,
      remaining,
      resetTime: record.resetTime,
    };
  }

  /**
   * Resets the limit for the given identifier.
   */
  async reset(identifier: string): Promise<void> {
    const key = this.getKey(identifier);
    await this.store.reset(key);
  }
}
