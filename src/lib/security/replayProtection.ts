/**
 * Replay Protection
 *
 * Prevents replay attacks by tracking request nonces and validating timestamps.
 * Uses in-memory storage — easily swapped to Redis for multi-instance deployments.
 *
 * Mechanism:
 *  1. Client sends a unique nonce + timestamp in each request.
 *  2. Server checks the nonce has not been seen before (within TTL).
 *  3. Server verifies timestamp is within acceptable skew.
 *  4. Nonce is stored until expiry, then cleaned up.
 */

import { randomBytes } from "crypto"
import { SECURITY_CONFIG } from "./securityConfig"

// ─── In-memory Nonce Store ────────────────────────────────────────────────────

interface NonceRecord {
  usedAt: number
  expiresAt: number
}

const nonceStore = new Map<string, NonceRecord>()
let lastCleanup = Date.now()

function maybeCleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [nonce, record] of nonceStore.entries()) {
    if (record.expiresAt < now) nonceStore.delete(nonce)
  }
  // Hard cap to prevent unbounded growth
  if (nonceStore.size > SECURITY_CONFIG.replay.maxStoreSize) {
    // Remove oldest entries
    const sorted = [...nonceStore.entries()].sort((a, b) => a[1].usedAt - b[1].usedAt)
    const toRemove = sorted.slice(0, Math.floor(SECURITY_CONFIG.replay.maxStoreSize * 0.2))
    for (const [key] of toRemove) nonceStore.delete(key)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Generates a cryptographically random nonce (base64url, 24 bytes → 32 chars). */
export function generateNonce(): string {
  return randomBytes(24).toString("base64url")
}

export interface ReplayCheckResult {
  valid: boolean
  reason?: "NONCE_REUSED" | "TIMESTAMP_EXPIRED" | "TIMESTAMP_FUTURE" | "MISSING_NONCE"
}

/**
 * Validates a request against replay attacks.
 * - Checks the timestamp is within the acceptable window.
 * - Checks the nonce has not been used before.
 *
 * Fail-open: returns { valid: true } on unexpected internal errors
 * so replay protection never blocks legitimate traffic.
 */
export function checkReplay(nonce: string | undefined, requestTimestamp: number): ReplayCheckResult {
  try {
    if (!nonce || nonce.trim() === "") {
      return { valid: false, reason: "MISSING_NONCE" }
    }

    maybeCleanup()

    const now = Date.now()
    const { requestExpiryMs } = SECURITY_CONFIG.replay

    // Reject expired requests
    if (now - requestTimestamp > requestExpiryMs) {
      return { valid: false, reason: "TIMESTAMP_EXPIRED" }
    }

    // Reject future timestamps (clock skew tolerance: 30s)
    if (requestTimestamp - now > 30_000) {
      return { valid: false, reason: "TIMESTAMP_FUTURE" }
    }

    // Reject replayed nonces
    if (nonceStore.has(nonce)) {
      return { valid: false, reason: "NONCE_REUSED" }
    }

    // Mark nonce as used
    nonceStore.set(nonce, {
      usedAt: now,
      expiresAt: now + SECURITY_CONFIG.replay.nonceTtlMs,
    })

    return { valid: true }
  } catch {
    // Fail-open
    return { valid: true }
  }
}

/**
 * Creates a pre-signed request token containing nonce + timestamp.
 * Use this on the server to issue tokens for client requests.
 */
export function createRequestToken(): { nonce: string; timestamp: number } {
  return {
    nonce: generateNonce(),
    timestamp: Date.now(),
  }
}

/** Returns the current nonce store size (useful for diagnostics). */
export function getNonceStoreSize(): number {
  return nonceStore.size
}
