import type { RateLimitConfig } from './types';

// Centralized source of truth for rate limit configurations
export const RATE_LIMITS = Object.freeze({
  LOGIN: Object.freeze({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),
  
  CRUD: Object.freeze({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  }),

  EXPORT: Object.freeze({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  SEARCH: Object.freeze({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),

  UPLOAD: Object.freeze({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  }),
} as const satisfies Record<string, RateLimitConfig>);
