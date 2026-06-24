/**
 * Login Rate Limiter
 *
 * In-memory rate limiter for login attempts.
 * Uses a sliding window approach with fixed-size entries.
 * Fail-open: all operations are wrapped to never throw.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
  lockedUntil: number
}

const CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
  cleanupIntervalMs: 60 * 1000,
}

const store = new Map<string, RateLimitEntry>()

let lastCleanup = Date.now()

function getEntry(email: string): RateLimitEntry | undefined {
  return store.get(email.toLowerCase().trim())
}

function setEntry(email: string, entry: RateLimitEntry): void {
  store.set(email.toLowerCase().trim(), entry)
}

function deleteEntry(email: string): void {
  store.delete(email.toLowerCase().trim())
}

/**
 * Check if login is allowed for the given email.
 * Returns { allowed: true } if login can proceed.
 * Returns { allowed: false, retryAfter } if rate-limited.
 * Fail-open: returns { allowed: true } on any internal error.
 */
export function check(email: string): { allowed: boolean; retryAfter?: number } {
  try {
    const now = Date.now()
    const key = email.toLowerCase().trim()

    // Lazy cleanup
    if (now - lastCleanup > CONFIG.cleanupIntervalMs) {
      cleanup()
      lastCleanup = now
    }

    const entry = getEntry(key)
    if (!entry) return { allowed: true }

    // Currently locked
    if (entry.lockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
      }
    }

    // Window expired — reset counter
    if (entry.resetAt < now) {
      deleteEntry(key)
      return { allowed: true }
    }

    // Within window but under limit
    return { allowed: true }
  } catch {
    // Fail-open: never block login due to internal error
    return { allowed: true }
  }
}

/**
 * Record a failed login attempt.
 * Increments count and locks the key if threshold is reached.
 * Fail-open: silently ignores errors.
 */
export function recordFailure(email: string): void {
  try {
    const now = Date.now()
    const key = email.toLowerCase().trim()
    const entry = getEntry(key)

    if (!entry || entry.resetAt < now) {
      // No entry or window expired — start new window
      setEntry(key, {
        count: 1,
        resetAt: now + CONFIG.windowMs,
        lockedUntil: 0,
      })
      return
    }

    entry.count++

    if (entry.count >= CONFIG.maxAttempts) {
      entry.lockedUntil = now + CONFIG.lockoutMs
    }

    setEntry(key, entry)
  } catch {
    // Fail-open: silently ignore
  }
}

/**
 * Record a successful login. Resets the counter for this email.
 * Fail-open: silently ignores errors.
 */
export function recordSuccess(email: string): void {
  try {
    deleteEntry(email)
  } catch {
    // Fail-open: silently ignore
  }
}

/**
 * Remove all expired entries from the store.
 * Called lazily on check() and can be called externally.
 */
export function cleanup(): void {
  try {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.lockedUntil > 0 && entry.lockedUntil < now) {
        store.delete(key)
      } else if (entry.resetAt < now && entry.lockedUntil === 0) {
        store.delete(key)
      }
    }
  } catch {
    // Silently ignore
  }
}
