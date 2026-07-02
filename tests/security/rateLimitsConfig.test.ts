import { describe, it, expect } from "vitest"
import { RATE_LIMITS } from "@/lib/security/rateLimit/config"

describe("RATE_LIMITS Configuration", () => {
  it("contains required rate limit configurations", () => {
    const expectedKeys = ["LOGIN", "CRUD", "EXPORT", "SEARCH", "UPLOAD"]
    const actualKeys = Object.keys(RATE_LIMITS)

    expectedKeys.forEach((key) => {
      expect(actualKeys).toContain(key)
    })
  })

  it("each configuration has valid windowMs and maxRequests", () => {
    Object.values(RATE_LIMITS).forEach((config) => {
      expect(config).toHaveProperty("windowMs")
      expect(config).toHaveProperty("maxRequests")
      expect(typeof config.windowMs).toBe("number")
      expect(typeof config.maxRequests).toBe("number")
      expect(config.windowMs).toBeGreaterThan(0)
      expect(config.maxRequests).toBeGreaterThan(0)
    })
  })

  describe("Immutability", () => {
    it("RATE_LIMITS is deeply frozen (immutable at runtime)", () => {
      // Verify parent object is frozen
      expect(Object.isFrozen(RATE_LIMITS)).toBe(true)

      // Verify every child configuration object is also frozen
      Object.values(RATE_LIMITS).forEach((config) => {
        expect(Object.isFrozen(config)).toBe(true)
      })
    })
  })
})
