/**
 * Enterprise Security Configuration
 *
 * Single Source of Truth for all configurable security parameters.
 * All magic numbers are centralised here — never scatter them in code.
 */

export const SECURITY_CONFIG = {
  // ─── CSRF ─────────────────────────────────────────────────────────────────
  csrf: {
    tokenTtlMs: 60 * 60 * 1000,           // 1 hour
    cookieName: "__Host-csrf",
    headerName: "x-csrf-token",
    tokenByteLength: 32,
  },

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  rateLimit: {
    // Global sliding window (per IP)
    global: {
      maxRequests: 300,
      windowMs: 60 * 1000,                 // 1 minute
    },
    // Auth endpoints
    auth: {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,           // 15 minutes
      lockoutMs: 15 * 60 * 1000,
    },
    // CRUD mutations
    crud: {
      maxRequests: 60,
      windowMs: 60 * 1000,
    },
    // Burst protection
    burst: {
      maxRequests: 20,
      windowMs: 5 * 1000,                  // 5 seconds
    },
  },

  // ─── Replay Protection ────────────────────────────────────────────────────
  replay: {
    nonceTtlMs: 5 * 60 * 1000,            // 5 minutes
    requestExpiryMs: 2 * 60 * 1000,       // 2 minutes
    maxStoreSize: 10_000,
  },

  // ─── Brute Force ──────────────────────────────────────────────────────────
  bruteForce: {
    maxFailures: 5,
    windowMs: 15 * 60 * 1000,            // 15 minutes
    baseBackoffMs: 1_000,                 // 1 second base
    maxBackoffMs: 30 * 60 * 1000,        // 30 minutes max
  },

  // ─── Threat Detection ─────────────────────────────────────────────────────
  threat: {
    permissionDeniedThreshold: 5,        // per window
    requestBurstThreshold: 50,           // per window
    loginFailThreshold: 3,               // per window
    scanThreshold: 10,                   // distinct endpoints per window
    windowMs: 60 * 1000,                 // 1 minute
  },

  // ─── Security Headers ─────────────────────────────────────────────────────
  headers: {
    hsts: {
      maxAge: 63_072_000,                // 2 years
      includeSubDomains: true,
      preload: true,
    },
    frameOptions: "DENY" as const,
    contentTypeOptions: "nosniff" as const,
    referrerPolicy: "strict-origin-when-cross-origin" as const,
  },

  // ─── Metrics ──────────────────────────────────────────────────────────────
  metrics: {
    retentionWindowMs: 24 * 60 * 60 * 1000, // 24 hours
    cleanupIntervalMs: 60 * 60 * 1000,       // 1 hour
  },
} as const

export type SecurityConfig = typeof SECURITY_CONFIG
