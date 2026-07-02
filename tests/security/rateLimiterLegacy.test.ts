import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { check, recordFailure, recordSuccess, cleanup } from "@/lib/security/rateLimiter"

// CONFIG values mirrored from implementation — do NOT change production code
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000   // 15 min
const LOCKOUT_MS = 15 * 60 * 1000  // 15 min

// ─── Unique email per test ─────────────────────────────────────────────────────
// The store is a module-level singleton. Using distinct emails per test prevents
// state bleeding between tests without needing a clearStore() export.
let emailSeed = 0
const newEmail = () => `legacy-${++emailSeed}@test.com`

// ─── Fake timer base ───────────────────────────────────────────────────────────
// NOTE: lastCleanup is set at real module-load time. Since we cannot reset it
// from tests, we do not test the lazy cleanup *trigger inside check()*.
// We test cleanup() directly instead, which is the public API.
const BASE_TIME = new Date("2024-06-01T12:00:00.000Z")

describe("Legacy Login Rate Limiter (rateLimiter.ts)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(BASE_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── 1. Initial state ────────────────────────────────────────────────────────

  describe("1. Initial state", () => {
    it("check() returns allowed for unseen identifier", () => {
      const result = check(newEmail())
      expect(result.allowed).toBe(true)
    })

    it("check() does not return retryAfter for unseen identifier", () => {
      const result = check(newEmail())
      expect(result.retryAfter).toBeUndefined()
    })

    it("check() returns allowed with a single recorded failure below threshold", () => {
      const email = newEmail()
      recordFailure(email)
      expect(check(email).allowed).toBe(true)
    })
  })

  // ─── 2. recordFailure() ───────────────────────────────────────────────────────

  describe("2. recordFailure()", () => {
    it("first failure does not lock the identifier", () => {
      const email = newEmail()
      recordFailure(email)
      expect(check(email).allowed).toBe(true)
    })

    it("failures below threshold keep identifier unlocked", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS - 1; i++) {
        recordFailure(email)
      }
      expect(check(email).allowed).toBe(true)
    })

    it("reaching the exact threshold locks the identifier", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        recordFailure(email)
      }
      expect(check(email).allowed).toBe(false)
    })

    it("lock duration is LOCKOUT_MS in seconds (ceiling)", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        recordFailure(email)
      }
      const result = check(email)
      const expectedSeconds = Math.ceil(LOCKOUT_MS / 1000)
      expect(result.retryAfter).toBe(expectedSeconds)
    })

    it("window starts on first failure — second failure within same window increments", () => {
      const email = newEmail()
      recordFailure(email)
      recordFailure(email)
      // 2 failures, still allowed
      expect(check(email).allowed).toBe(true)
    })
  })

  // ─── 3. Locked state ─────────────────────────────────────────────────────────

  describe("3. Locked state", () => {
    it("check() returns blocked while locked", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)
      expect(check(email).allowed).toBe(false)
    })

    it("retryAfter is positive and not undefined while locked", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)
      const { retryAfter } = check(email)
      expect(retryAfter).toBeDefined()
      expect(retryAfter!).toBeGreaterThan(0)
    })

    it("retryAfter decreases as time passes", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)

      const retryBefore = check(email).retryAfter!

      vi.advanceTimersByTime(5 * 60 * 1000) // advance 5 min

      const retryAfterWait = check(email).retryAfter!
      expect(retryAfterWait).toBeLessThan(retryBefore)
      expect(retryAfterWait).toBeGreaterThan(0)
    })

    it("retryAfter never returns negative", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)

      // Advance to just before lock expires
      vi.advanceTimersByTime(LOCKOUT_MS - 1000)

      const result = check(email)
      expect(result.retryAfter!).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── 4. Window expiration ─────────────────────────────────────────────────────

  describe("4. Window expiration", () => {
    it("check() allows the identifier after the window expires (entry deleted lazily)", () => {
      const email = newEmail()
      recordFailure(email)
      recordFailure(email)

      vi.advanceTimersByTime(WINDOW_MS + 1000)

      expect(check(email).allowed).toBe(true)
    })

    it("subsequent failures after window expiry start a fresh window", () => {
      const email = newEmail()
      // Accumulate MAX_ATTEMPTS - 1 failures
      for (let i = 0; i < MAX_ATTEMPTS - 1; i++) recordFailure(email)

      // Let the window expire
      vi.advanceTimersByTime(WINDOW_MS + 1000)

      // New failure — fresh window, count = 1
      recordFailure(email)
      expect(check(email).allowed).toBe(true)
    })
  })

  // ─── 5. recordSuccess() ───────────────────────────────────────────────────────

  describe("5. recordSuccess()", () => {
    it("clears failures so check() returns allowed", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS - 1; i++) recordFailure(email)
      recordSuccess(email)
      expect(check(email).allowed).toBe(true)
    })

    it("clears a fully-locked identifier", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)
      recordSuccess(email)
      const result = check(email)
      expect(result.allowed).toBe(true)
      expect(result.retryAfter).toBeUndefined()
    })

    it("subsequent check() behaves exactly like a fresh identifier", () => {
      const email = newEmail()
      recordFailure(email)
      recordSuccess(email)
      const result = check(email)
      expect(result.allowed).toBe(true)
      expect(result.retryAfter).toBeUndefined()
    })

    it("repeated recordSuccess() calls do not throw", () => {
      const email = newEmail()
      expect(() => {
        recordSuccess(email)
        recordSuccess(email)
        recordSuccess(email)
      }).not.toThrow()
    })
  })

  // ─── 6. cleanup() ─────────────────────────────────────────────────────────────

  describe("6. cleanup()", () => {
    it("removes an expired unlocked entry", () => {
      const email = newEmail()
      recordFailure(email)

      vi.advanceTimersByTime(WINDOW_MS + 1000)
      cleanup()

      // check() would create a fresh lookup — should be allowed
      expect(check(email).allowed).toBe(true)
    })

    it("removes an expired locked entry", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)

      vi.advanceTimersByTime(LOCKOUT_MS + 1000)
      cleanup()

      expect(check(email).allowed).toBe(true)
    })

    it("preserves an active locked entry that has not yet expired", () => {
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)

      // Advance only 5 min — still within lockout
      vi.advanceTimersByTime(5 * 60 * 1000)
      cleanup()

      expect(check(email).allowed).toBe(false)
    })

    it("calling cleanup() on an empty store is safe", () => {
      expect(() => cleanup()).not.toThrow()
    })

    it("calling cleanup() repeatedly is safe", () => {
      expect(() => {
        cleanup()
        cleanup()
        cleanup()
      }).not.toThrow()
    })
  })

  // ─── 7. Isolation ─────────────────────────────────────────────────────────────

  describe("7. Isolation", () => {
    it("failures for one identifier do not affect another", () => {
      const emailA = newEmail()
      const emailB = newEmail()

      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(emailA)

      expect(check(emailA).allowed).toBe(false)
      expect(check(emailB).allowed).toBe(true)
    })

    it("recordSuccess() for one identifier does not clear another", () => {
      const emailA = newEmail()
      const emailB = newEmail()

      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(emailA)
      recordFailure(emailB)
      recordSuccess(emailB)

      // emailA is still locked
      expect(check(emailA).allowed).toBe(false)
    })

    it("recordSuccess() on one identifier does not unlock another", () => {
      const emailA = newEmail()
      const emailB = newEmail()

      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(emailA)
      recordSuccess(emailB)

      expect(check(emailA).allowed).toBe(false)
    })
  })

  // ─── 8. Edge cases ────────────────────────────────────────────────────────────

  describe("8. Edge cases", () => {
    it("additional recordFailure() calls while locked extend the lock", () => {
      // This verifies the actual implementation: lockedUntil = now + lockoutMs
      // is re-set on every failure while entry.resetAt is still in the future.
      const email = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(email)

      // Advance 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)
      const retryMid = check(email).retryAfter! // ~600 s

      // Another failure while still locked and within window — resets lockedUntil
      recordFailure(email)

      const retryAfterExtra = check(email).retryAfter! // should jump back to ~900 s
      expect(retryAfterExtra).toBeGreaterThan(retryMid)
    })

    it("email normalisation: uppercase is treated as the same key as lowercase", () => {
      const base = newEmail() // already lowercase
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(base)

      // Uppercase variant should see the same locked state
      expect(check(base.toUpperCase()).allowed).toBe(false)
    })

    it("email normalisation: surrounding whitespace is stripped", () => {
      const base = newEmail()
      for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(`  ${base}  `)

      // Trimmed version sees the lock
      expect(check(base).allowed).toBe(false)
    })
  })

  // ─── 9. Fail-open behaviour ───────────────────────────────────────────────────

  describe("9. Fail-open behaviour", () => {
    it("check() never throws", () => {
      expect(() => check(newEmail())).not.toThrow()
    })

    it("check() returns allowed even under normal operation (no internal error path exercisable externally)", () => {
      // The implementation catches all internal errors and returns { allowed: true }.
      // Under normal operation the happy path is also fail-open by design.
      const result = check(newEmail())
      expect(result.allowed).toBe(true)
    })

    it("recordFailure() never throws", () => {
      expect(() => recordFailure(newEmail())).not.toThrow()
    })

    it("recordSuccess() never throws", () => {
      expect(() => recordSuccess(newEmail())).not.toThrow()
    })

    it("cleanup() never throws", () => {
      expect(() => cleanup()).not.toThrow()
    })
  })
})
