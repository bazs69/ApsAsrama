/**
 * Security Metrics
 *
 * Lightweight in-memory counter store for security-relevant events.
 * This is the *foundation* layer — no UI yet.
 *
 * Tracked metrics:
 * - failed_login
 * - blocked_request
 * - csrf_failure
 * - rate_limit_hit
 * - suspicious_event
 *
 * Design: additive-only, fail-open, auto-cleanup by retention window.
 */

import { SECURITY_CONFIG } from "./securityConfig"

// ─── Metric Types ─────────────────────────────────────────────────────────────

export type MetricKey =
  | "failed_login"
  | "blocked_request"
  | "csrf_failure"
  | "rate_limit_hit"
  | "suspicious_event"
  | "replay_rejected"
  | "brute_force_blocked"
  | "permission_denied"

interface MetricEntry {
  count: number
  lastSeenAt: number
  firstSeenAt: number
}

// ─── Internal Store ───────────────────────────────────────────────────────────

const metricStore = new Map<MetricKey, MetricEntry>()
let lastCleanup = Date.now()

function maybeCleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < SECURITY_CONFIG.metrics.cleanupIntervalMs) return
  lastCleanup = now
  for (const [key, entry] of metricStore.entries()) {
    if (now - entry.firstSeenAt > SECURITY_CONFIG.metrics.retentionWindowMs) {
      metricStore.delete(key)
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Increments the counter for a given metric key.
 * Fail-open: silently ignores all errors.
 */
export function incrementMetric(key: MetricKey, by = 1): void {
  try {
    maybeCleanup()
    const now = Date.now()
    const existing = metricStore.get(key)
    if (existing) {
      existing.count += by
      existing.lastSeenAt = now
    } else {
      metricStore.set(key, { count: by, lastSeenAt: now, firstSeenAt: now })
    }
  } catch {
    // Fail-open
  }
}

/**
 * Returns the current count for a metric.
 */
export function getMetric(key: MetricKey): number {
  return metricStore.get(key)?.count ?? 0
}

/**
 * Returns a snapshot of all current metrics.
 */
export function getMetricsSnapshot(): Record<MetricKey, number> {
  maybeCleanup()
  const snapshot: Partial<Record<MetricKey, number>> = {}
  for (const [key, entry] of metricStore.entries()) {
    snapshot[key] = entry.count
  }
  return snapshot as Record<MetricKey, number>
}

/**
 * Resets a specific metric counter (useful in tests).
 */
export function resetMetric(key: MetricKey): void {
  metricStore.delete(key)
}

/**
 * Resets all metric counters (useful in tests).
 */
export function resetAllMetrics(): void {
  metricStore.clear()
}
