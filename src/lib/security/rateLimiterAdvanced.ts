/**
 * Advanced Rate Limiter
 *
 * Extends and complements the existing rateLimiter.ts (login-only).
 * Provides sliding-window, burst protection, per-user, and per-IP limiting.
 *
 * Design principles:
 * - 100% backward compatible — existing code is untouched.
 * - Fail-open: never blocks requests due to internal errors.
 * - Memory-only; easily swappable to Redis by replacing the `store` backend.
 */

import { SECURITY_CONFIG } from "./securityConfig"

// ─── Internal Store ───────────────────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[]   // Sliding window of request timestamps
  lockedUntil: number    // If > now, key is blocked
}

class SlidingWindowStore {
  private store = new Map<string, WindowEntry>()
  private lastCleanup = Date.now()
  private cleanupIntervalMs = 60_000

  get(key: string): WindowEntry | undefined {
    return this.store.get(key)
  }

  set(key: string, entry: WindowEntry): void {
    this.store.set(key, entry)
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  /** Lazy cleanup to prevent unbounded memory growth. */
  maybeCleanup(): void {
    const now = Date.now()
    if (now - this.lastCleanup < this.cleanupIntervalMs) return
    this.lastCleanup = now
    for (const [key, entry] of this.store.entries()) {
      if (entry.lockedUntil < now && entry.timestamps.length === 0) {
        this.store.delete(key)
      }
    }
  }
}

const globalStore  = new SlidingWindowStore()
const burstStore   = new SlidingWindowStore()

// ─── Core Sliding Window Logic ───────────────────────────────────────────────

interface LimitConfig {
  maxRequests: number
  windowMs: number
  lockoutMs?: number
}

interface LimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number  // seconds
}

function checkLimit(
  store: SlidingWindowStore,
  key: string,
  config: LimitConfig,
): LimitResult {
  try {
    store.maybeCleanup()
    const now = Date.now()
    const entry = store.get(key) ?? { timestamps: [], lockedUntil: 0 }

    // Currently locked
    if (entry.lockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
      }
    }

    // Evict timestamps outside the window
    const windowStart = now - config.windowMs
    entry.timestamps = entry.timestamps.filter(t => t > windowStart)

    if (entry.timestamps.length >= config.maxRequests) {
      // Lock if lockoutMs configured, otherwise just reject
      if (config.lockoutMs) {
        entry.lockedUntil = now + config.lockoutMs
      }
      store.set(key, entry)
      return {
        allowed: false,
        remaining: 0,
        retryAfter: config.lockoutMs
          ? Math.ceil(config.lockoutMs / 1000)
          : Math.ceil(config.windowMs / 1000),
      }
    }

    entry.timestamps.push(now)
    store.set(key, entry)

    return {
      allowed: true,
      remaining: config.maxRequests - entry.timestamps.length,
    }
  } catch {
    // Fail-open
    return { allowed: true, remaining: 0 }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Per-IP global rate limit. */
export function checkGlobalLimit(ip: string): LimitResult {
  return checkLimit(globalStore, `global:${ip}`, SECURITY_CONFIG.rateLimit.global)
}

/** Per-user CRUD mutation rate limit. */
export function checkCrudLimit(userId: string): LimitResult {
  return checkLimit(globalStore, `crud:${userId}`, SECURITY_CONFIG.rateLimit.crud)
}

/** Per-IP auth endpoint rate limit (tighter window). */
export function checkAuthLimit(ip: string): LimitResult {
  return checkLimit(
    globalStore,
    `auth:${ip}`,
    {
      maxRequests: SECURITY_CONFIG.rateLimit.auth.maxRequests,
      windowMs: SECURITY_CONFIG.rateLimit.auth.windowMs,
      lockoutMs: SECURITY_CONFIG.rateLimit.auth.lockoutMs,
    },
  )
}

/** Burst protection — very short window, strict limit. */
export function checkBurstLimit(key: string): LimitResult {
  return checkLimit(burstStore, `burst:${key}`, SECURITY_CONFIG.rateLimit.burst)
}

/** Endpoint-group limiter — groups multiple paths under one limit. */
export function checkEndpointGroupLimit(group: string, ip: string): LimitResult {
  return checkLimit(globalStore, `endpoint:${group}:${ip}`, SECURITY_CONFIG.rateLimit.crud)
}
