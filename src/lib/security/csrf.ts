/**
 * CSRF Protection Foundation
 *
 * Stateless CSRF token generation and verification using Node's built-in `crypto`.
 * No external packages required.
 *
 * Design:
 *   token = randomBytes(32) → base64url  (nonce part)
 *   signed = HMAC-SHA256(token, secret)  → hex      (integrity part)
 *   final  = `${nonce}.${signed}`
 *
 * This is a "double-submit cookie" variant that is safe against BREACH attacks.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { SECURITY_CONFIG } from "./securityConfig"

// Derive secret from env — falls back to a constant for dev only.
// In production, set CSRF_SECRET in environment variables.
const SECRET = process.env.CSRF_SECRET ?? "dev-csrf-secret-change-in-production"

function sign(nonce: string): string {
  return createHmac("sha256", SECRET).update(nonce).digest("hex")
}

/**
 * Generates a new CSRF token valid for SECURITY_CONFIG.csrf.tokenTtlMs.
 * Returns a string formatted as `<nonce>.<timestamp>.<signature>`.
 */
export function generateToken(): string {
  const nonce = randomBytes(SECURITY_CONFIG.csrf.tokenByteLength).toString("base64url")
  const ts = Date.now().toString()
  const signature = sign(`${nonce}.${ts}`)
  return `${nonce}.${ts}.${signature}`
}

/**
 * Verifies that a CSRF token is genuine and has not expired.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyToken(token: string): boolean {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return false

    const [nonce, ts, signature] = parts
    const timestamp = parseInt(ts, 10)

    // Reject tokens older than ttl
    if (Date.now() - timestamp > SECURITY_CONFIG.csrf.tokenTtlMs) return false

    const expected = sign(`${nonce}.${ts}`)

    // Timing-safe compare
    const expectedBuf = Buffer.from(expected, "utf8")
    const actualBuf   = Buffer.from(signature, "utf8")
    if (expectedBuf.length !== actualBuf.length) return false

    return timingSafeEqual(expectedBuf, actualBuf)
  } catch {
    return false
  }
}

/**
 * Generates a fresh token to replace an existing one.
 * Call after any validated state mutation to limit token reuse window.
 */
export function rotateToken(): string {
  return generateToken()
}
