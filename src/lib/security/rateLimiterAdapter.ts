/**
 * Rate Limiter Adapter
 * 
 * Abstraction layer for rate limiting. Currently wraps MemoryStore.
 * 
 * Implementasi saat ini menggunakan Memory Store dan siap diganti Redis
 * tanpa perubahan pada Business Layer di Production V2.
 */
import { RateLimiter, RATE_LIMITS, MemoryStore } from "@/lib/security/rateLimit"
import type { RateLimitResult } from "@/lib/security/rateLimit"

// Initialize with MemoryStore for now
const crudStore = new MemoryStore()
const crudLimiter = new RateLimiter(crudStore, RATE_LIMITS.CRUD, "crud")

export const rateLimiterAdapter = {
  /**
   * Consumes 1 point for the given identifier (usually user ID).
   */
  consume: async (identifier: string): Promise<RateLimitResult> => {
    return await crudLimiter.consume(identifier)
  },

  /**
   * Checks the limit without consuming a point.
   */
  getRemaining: async (identifier: string): Promise<RateLimitResult> => {
    return await crudLimiter.check(identifier)
  },

  /**
   * Resets the rate limit for the given identifier.
   */
  reset: async (identifier: string): Promise<void> => {
    return await crudLimiter.reset(identifier)
  }
}
