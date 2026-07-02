import { describe, it, expect, beforeEach } from "vitest"
import { RateLimiter } from "@/lib/security/rateLimit/rateLimiter"
import type { RateLimitStore, RateLimitRecord, RateLimitConfig } from "@/lib/security/rateLimit/types"

class MockStore implements RateLimitStore {
  records: Map<string, RateLimitRecord> = new Map()

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    const record = this.records.get(key)
    if (record) {
      record.count += 1
      return record
    }
    const newRecord = { count: 1, resetTime: Date.now() + windowMs }
    this.records.set(key, newRecord)
    return newRecord
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    return this.records.get(key) || null
  }

  async reset(key: string): Promise<void> {
    this.records.delete(key)
  }
}

describe("RateLimiter", () => {
  let store: MockStore
  let config: RateLimitConfig
  let limiter: RateLimiter

  beforeEach(() => {
    store = new MockStore()
    config = { windowMs: 60000, maxRequests: 2 }
    limiter = new RateLimiter(store, config, "test")
  })

  describe("constructor", () => {
    it("accepts injected store and config", () => {
      expect(limiter).toBeInstanceOf(RateLimiter)
    })

    it("maintains independent instances", async () => {
      const limiter2 = new RateLimiter(store, config, "other")
      await limiter.consume("user1")
      await limiter2.consume("user1")
      
      const res1 = await limiter.check("user1")
      const res2 = await limiter2.check("user1")
      
      // They share the store, but have different prefixes
      expect(res1.remaining).toBe(1)
      expect(res2.remaining).toBe(1)
    })
  })

  describe("consume()", () => {
    it("allows first request", async () => {
      const result = await limiter.consume("user1")
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
      expect(result.limit).toBe(2)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it("allows request exactly at limit", async () => {
      await limiter.consume("user1")
      const result = await limiter.consume("user1")
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it("blocks request above limit", async () => {
      await limiter.consume("user1")
      await limiter.consume("user1")
      const result = await limiter.consume("user1")
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0) // Remaining should not be negative
    })
    
    it("isolates namespaces by prefix", async () => {
      // test prefix automatically prefixes keys in the store
      await limiter.consume("user1")
      const record = await store.get("test:user1")
      expect(record).not.toBeNull()
    })
  })

  describe("check()", () => {
    it("returns correctly for existing entry", async () => {
      await limiter.consume("user1")
      const result = await limiter.check("user1")
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it("returns default values for missing entry", async () => {
      const result = await limiter.check("missing")
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(2)
      expect(result.limit).toBe(2)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it("identifies blocked entries", async () => {
      await limiter.consume("user1")
      await limiter.consume("user1")
      await limiter.consume("user1") // 3rd request
      
      const result = await limiter.check("user1")
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe("reset()", () => {
    it("delegates to store", async () => {
      await limiter.consume("user1")
      expect(await store.get("test:user1")).not.toBeNull()
      
      await limiter.reset("user1")
      expect(await store.get("test:user1")).toBeNull()
    })
  })
})
