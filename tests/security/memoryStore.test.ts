import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { MemoryStore } from "@/lib/security/rateLimit/memoryStore"

describe("MemoryStore", () => {
  let store: MemoryStore

  beforeEach(() => {
    store = new MemoryStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("increment()", () => {
    it("creates a new window", async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      const record = await store.increment("user1", 60000)
      expect(record.count).toBe(1)
      expect(record.resetTime).toBe(now + 60000)
    })

    it("increments within the same window", async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      await store.increment("user1", 60000)
      const record = await store.increment("user1", 60000)
      expect(record.count).toBe(2)
      expect(record.resetTime).toBe(now + 60000)
    })

    it("creates a new window after expiry", async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      await store.increment("user1", 60000)
      
      // Advance time past the window
      const future = now + 60001
      vi.setSystemTime(future)
      
      const record = await store.increment("user1", 60000)
      expect(record.count).toBe(1)
      expect(record.resetTime).toBe(future + 60000)
    })
  })

  describe("get()", () => {
    it("returns null for missing keys", async () => {
      const record = await store.get("missing")
      expect(record).toBeNull()
    })

    it("performs lazy expiration", async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      await store.increment("user1", 60000)
      
      // Advance time past the window
      vi.setSystemTime(now + 60001)
      
      const record = await store.get("user1")
      expect(record).toBeNull()
    })
    
    it("returns active record", async () => {
      const now = Date.now()
      vi.setSystemTime(now)
      await store.increment("user1", 60000)
      
      const record = await store.get("user1")
      expect(record).not.toBeNull()
      expect(record?.count).toBe(1)
    })
  })

  describe("reset()", () => {
    it("removes an existing key", async () => {
      await store.increment("user1", 60000)
      await store.reset("user1")
      const record = await store.get("user1")
      expect(record).toBeNull()
    })

    it("handles reset on missing key gracefully", async () => {
      await expect(store.reset("missing")).resolves.toBeUndefined()
    })
  })

  describe("clear()", () => {
    it("removes every entry", async () => {
      await store.increment("user1", 60000)
      await store.increment("user2", 60000)
      store.clear()
      const record1 = await store.get("user1")
      const record2 = await store.get("user2")
      expect(record1).toBeNull()
      expect(record2).toBeNull()
    })
  })

  describe("isolation", () => {
    it("keeps multiple identifiers isolated", async () => {
      await store.increment("user1", 60000)
      await store.increment("user2", 60000)
      
      await store.increment("user1", 60000)
      
      const final1 = await store.get("user1")
      const final2 = await store.get("user2")
      
      expect(final1?.count).toBe(2)
      expect(final2?.count).toBe(1)
    })
  })
})
