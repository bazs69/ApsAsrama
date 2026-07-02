/**
 * Brute Force Protection
 *
 * Detects and penalises repeated failures for sensitive operations:
 * - Login attempts
 * - Password reset abuse
 * - Permission probing
 *
 * Uses exponential back-off with a hard ceiling to prevent DoS.
 * Fail-open: never blocks a request due to internal errors.
 */

import { SECURITY_CONFIG } from "./securityConfig"

// ─── Internal Store ───────────────────────────────────────────────────────────

type ActionType = "login" | "password_reset" | "permission_probe"

interface BruteEntry {
  failures: number
  firstFailureAt: number
  lockedUntil: number
}

const store = new Map<string, BruteEntry>()
let lastCleanup = Date.now()

function maybeCleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (entry.lockedUntil < now && entry.firstFailureAt + SECURITY_CONFIG.bruteForce.windowMs < now) {
      store.delete(key)
    }
  }
}

function buildKey(identifier: string, action: ActionType): string {
  return `${action}:${identifier.toLowerCase().trim()}`
}

/**
 * Calculates exponential back-off duration based on number of failures.
 * Formula: base * 2^(failures-1), capped at maxBackoffMs.
 */
function calcBackoff(failures: number): number {
  const { baseBackoffMs, maxBackoffMs } = SECURITY_CONFIG.bruteForce
  const ms = baseBackoffMs * Math.pow(2, failures - 1)
  return Math.min(ms, maxBackoffMs)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface BruteCheckResult {
  allowed: boolean
  failures: number
  retryAfter?: number  // seconds
}

/**
 * Checks whether an action is allowed for the given identifier.
 */
export function checkBruteForce(identifier: string, action: ActionType): BruteCheckResult {
  try {
    maybeCleanup()
    const key = buildKey(identifier, action)
    const now = Date.now()
    const entry = store.get(key)

    if (!entry) return { allowed: true, failures: 0 }

    // Reset if window expired
    if (now - entry.firstFailureAt > SECURITY_CONFIG.bruteForce.windowMs) {
      store.delete(key)
      return { allowed: true, failures: 0 }
    }

    // Currently locked
    if (entry.lockedUntil > now) {
      return {
        allowed: false,
        failures: entry.failures,
        retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
      }
    }

    return { allowed: true, failures: entry.failures }
  } catch {
    return { allowed: true, failures: 0 }
  }
}

/**
 * Records a failed attempt for the identifier + action.
 * Applies exponential back-off if threshold is exceeded.
 */
export function recordBruteFailure(identifier: string, action: ActionType): void {
  try {
    const key = buildKey(identifier, action)
    const now = Date.now()
    const existing = store.get(key)

    if (!existing || now - existing.firstFailureAt > SECURITY_CONFIG.bruteForce.windowMs) {
      store.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 })
      return
    }

    existing.failures++

    if (existing.failures >= SECURITY_CONFIG.bruteForce.maxFailures) {
      existing.lockedUntil = now + calcBackoff(existing.failures)
    }

    store.set(key, existing)
  } catch {
    // Fail-open: never crash on recording
  }
}

/**
 * Clears the brute-force record for an identifier (e.g. after successful login).
 */
export function clearBruteRecord(identifier: string, action: ActionType): void {
  try {
    store.delete(buildKey(identifier, action))
  } catch {
    // Fail-open
  }
}

/** Returns how many failures are on record (useful for diagnostics). */
export function getBruteFailures(identifier: string, action: ActionType): number {
  return store.get(buildKey(identifier, action))?.failures ?? 0
}
