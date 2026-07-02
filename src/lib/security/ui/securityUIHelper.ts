/**
 * Security UI Helper — Read-only wrapper
 *
 * Aggregates data from Security Layer (securityMetrics, threatDetector, breadcrumbStore)
 * for UI consumption. This file DOES NOT modify any Security Layer logic.
 *
 * Scope: src/lib/security/ui/ — purely presentational data aggregation.
 */

import { getMetricsSnapshot, type MetricKey } from "@/lib/security/securityMetrics"
import { breadcrumbStore } from "@/lib/monitoring/breadcrumb"
import type { ThreatLevel } from "@/lib/security/threatDetector"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecurityMetricsSnapshot {
  failedLogin: number
  blockedRequest: number
  csrfFailure: number
  rateLimitHit: number
  suspiciousEvent: number
  replayRejected: number
  bruteForceBlocked: number
  permissionDenied: number
}

export interface SecurityEvent {
  timestamp: number
  severity: string
  message: string
  category: string
}

export interface SecuritySummary {
  metrics: SecurityMetricsSnapshot
  recentSecurityEvents: SecurityEvent[]
  threatLevel: ThreatLevel
  recommendations: string[]
}

// ─── Thresholds (UI only, read from constants) ───────────────────────────────

const THRESHOLDS = {
  failedLoginWarning: 3,
  rateLimitWarning: 10,
  replayWarning: 0,
  bruteForceWarning: 0,
  criticalScore: 8,
  highScore: 5,
}

// ─── Aggregation Functions ────────────────────────────────────────────────────

function toMetricsSnapshot(raw: Record<MetricKey, number>): SecurityMetricsSnapshot {
  return {
    failedLogin: raw["failed_login"] ?? 0,
    blockedRequest: raw["blocked_request"] ?? 0,
    csrfFailure: raw["csrf_failure"] ?? 0,
    rateLimitHit: raw["rate_limit_hit"] ?? 0,
    suspiciousEvent: raw["suspicious_event"] ?? 0,
    replayRejected: raw["replay_rejected"] ?? 0,
    bruteForceBlocked: raw["brute_force_blocked"] ?? 0,
    permissionDenied: raw["permission_denied"] ?? 0,
  }
}

/**
 * Derives a system-level ThreatLevel from current security metrics.
 * Read-only — no side effects.
 */
function deriveThreatLevel(m: SecurityMetricsSnapshot): ThreatLevel {
  let score = 0
  if (m.bruteForceBlocked > THRESHOLDS.bruteForceWarning) score += 4
  if (m.replayRejected > THRESHOLDS.replayWarning) score += 3
  if (m.failedLogin >= THRESHOLDS.failedLoginWarning) score += 2
  if (m.rateLimitHit >= THRESHOLDS.rateLimitWarning) score += 1
  if (m.csrfFailure > 0) score += 2
  if (m.suspiciousEvent > 0) score += 2

  if (score >= THRESHOLDS.criticalScore) return "CRITICAL"
  if (score >= THRESHOLDS.highScore) return "HIGH"
  if (score >= 2) return "MEDIUM"
  return "LOW"
}

/**
 * Builds automated recommendations based on metrics snapshot.
 */
function buildRecommendations(m: SecurityMetricsSnapshot): string[] {
  const recs: string[] = []

  if (m.failedLogin >= THRESHOLDS.failedLoginWarning) {
    recs.push(`${m.failedLogin} percobaan login gagal terdeteksi. Pertimbangkan meningkatkan threshold lockout.`)
  }
  if (m.replayRejected > THRESHOLDS.replayWarning) {
    recs.push(`Replay protection aktif dan mendeteksi ${m.replayRejected} aktivitas mencurigakan.`)
  }
  if (m.bruteForceBlocked > THRESHOLDS.bruteForceWarning) {
    recs.push(`Brute force protection memblokir ${m.bruteForceBlocked} percobaan.`)
  }
  if (m.csrfFailure > 0) {
    recs.push(`${m.csrfFailure} kegagalan CSRF terdeteksi. Pastikan semua form menggunakan CSRF token.`)
  }
  if (m.rateLimitHit >= THRESHOLDS.rateLimitWarning) {
    recs.push(`Rate limiter memeriksa ${m.rateLimitHit} request. Pantau pola penggunaan API.`)
  }

  if (recs.length === 0) {
    recs.push("Tidak ada ancaman keamanan signifikan yang terdeteksi. Sistem berjalan normal.")
  }

  return recs
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the complete Security Summary for the dashboard.
 * Read-only — does not modify any Security Layer state.
 */
export function getSecuritySummary(): SecuritySummary {
  const rawMetrics = getMetricsSnapshot()
  const metrics = toMetricsSnapshot(rawMetrics)

  const allCrumbs = breadcrumbStore.getAll()
  const recentSecurityEvents: SecurityEvent[] = allCrumbs
    .filter(c => c.category === "SECURITY" || c.category === "AUTH" || c.category === "ERROR")
    .slice(-10)
    .reverse()
    .map(c => ({
      timestamp: c.timestamp,
      severity: c.severity,
      message: c.message,
      category: c.category,
    }))

  const threatLevel = deriveThreatLevel(metrics)
  const recommendations = buildRecommendations(metrics)

  return {
    metrics,
    recentSecurityEvents,
    threatLevel,
    recommendations,
  }
}
