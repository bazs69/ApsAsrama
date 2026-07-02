import { describe, it, expect, beforeEach, vi } from "vitest"
import { getServerSession } from "next-auth"
import { logAuditEvent } from "@/lib/security/auditLogger"

// ─── Hoist mock fns so they are available inside vi.mock factories ────────────
const { mockConsume } = vi.hoisted(() => ({
  mockConsume: vi.fn(),
}))

// ─── Mock the rateLimit module so the module-level crudLimiter singleton
//     receives a mock consume() function at construction time ──────────────────
vi.mock("@/lib/security/rateLimit", () => {
  class MockMemoryStore {}
  class MockRateLimiter {
    consume = mockConsume
  }
  return {
    MemoryStore: MockMemoryStore,
    RateLimiter: MockRateLimiter,
    RATE_LIMITS: {
      CRUD: Object.freeze({ windowMs: 60000, maxRequests: 60 }),
    },
  }
})

// ─── Mock next-auth ───────────────────────────────────────────────────────────
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

// ─── Mock @/lib/auth to avoid importing real NextAuth config ──────────────────
vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

// ─── Mock audit logger ────────────────────────────────────────────────────────
vi.mock("@/lib/security/auditLogger", () => ({
  logAuditEvent: vi.fn(),
}))

// Import under test AFTER mocks are declared
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeSession = (userId = "user-1") => ({
  user: { id: userId, name: "Test", email: "test@example.com" },
  expires: "9999-12-31",
})

const makeAllowedResult = () => ({
  success: true,
  limit: 60,
  remaining: 59,
  resetTime: Date.now() + 60000,
})

const makeBlockedResult = (remaining = 0, resetTime = Date.now() + 30000) => ({
  success: false,
  limit: 60,
  remaining,
  resetTime,
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("checkCrudRateLimit()", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("No session", () => {
    it("returns null when session is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const result = await checkCrudRateLimit()

      expect(result).toBeNull()
    })

    it("never calls the limiter when session is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      await checkCrudRateLimit()

      expect(mockConsume).not.toHaveBeenCalled()
    })
  })

  describe("Limiter allows request", () => {
    it("returns the session user ID", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession("user-42"))
      mockConsume.mockResolvedValue(makeAllowedResult())

      const result = await checkCrudRateLimit()

      expect(result).toBe("user-42")
    })

    it("does not call logAuditEvent", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockResolvedValue(makeAllowedResult())

      await checkCrudRateLimit()

      expect(vi.mocked(logAuditEvent)).not.toHaveBeenCalled()
    })
  })

  describe("Limiter blocks request", () => {
    it("returns null when limiter blocks", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockResolvedValue(makeBlockedResult(0, Date.now() + 10000))

      const result = await checkCrudRateLimit()

      expect(result).toBeNull()
    })

    it("calls logAuditEvent exactly once when blocked", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession("user-99"))
      mockConsume.mockResolvedValue(makeBlockedResult())

      await checkCrudRateLimit()

      expect(vi.mocked(logAuditEvent)).toHaveBeenCalledTimes(1)
    })

    it("passes actorId = userId to logAuditEvent", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession("user-abc"))
      mockConsume.mockResolvedValue(makeBlockedResult())

      await checkCrudRateLimit()

      expect(vi.mocked(logAuditEvent)).toHaveBeenCalledWith(
        expect.objectContaining({ actorId: "user-abc" })
      )
    })

    it("passes resource = 'crud' to logAuditEvent", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockResolvedValue(makeBlockedResult())

      await checkCrudRateLimit()

      expect(vi.mocked(logAuditEvent)).toHaveBeenCalledWith(
        expect.objectContaining({ resource: "crud" })
      )
    })

    it("passes remaining and resetTime in metadata", async () => {
      const remaining = 5
      const resetTime = Date.now() + 20000
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockResolvedValue(makeBlockedResult(remaining, resetTime))

      await checkCrudRateLimit()

      expect(vi.mocked(logAuditEvent)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ remaining, resetTime }),
        })
      )
    })
  })

  describe("Audit logger throws (fail-open)", () => {
    it("still returns null even if logAuditEvent throws", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockResolvedValue(makeBlockedResult())
      vi.mocked(logAuditEvent).mockRejectedValue(new Error("DB down"))

      const result = await checkCrudRateLimit()

      expect(result).toBeNull()
    })

    it("does not propagate the logAuditEvent error", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockResolvedValue(makeBlockedResult())
      vi.mocked(logAuditEvent).mockRejectedValue(new Error("Network timeout"))

      await expect(checkCrudRateLimit()).resolves.toBeNull()
    })
  })

  describe("Limiter consume() throws", () => {
    it("propagates the error (no outer try/catch in implementation)", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockRejectedValue(new Error("Store failure"))

      await expect(checkCrudRateLimit()).rejects.toThrow("Store failure")
    })

    it("does not call logAuditEvent when consume() throws", async () => {
      vi.mocked(getServerSession).mockResolvedValue(makeSession())
      mockConsume.mockRejectedValue(new Error("Store failure"))

      try {
        await checkCrudRateLimit()
      } catch {
        // expected
      }

      expect(vi.mocked(logAuditEvent)).not.toHaveBeenCalled()
    })
  })
})
