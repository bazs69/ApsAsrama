/**
 * Suspicious Activity / Threat Detector
 *
 * Correlates security signals across multiple dimensions to assign a ThreatLevel:
 *   LOW → MEDIUM → HIGH → CRITICAL
 *
 * Detected signals:
 * - Too many requests (rate spike)
 * - Permission denied bursts (privilege probing)
 * - Repeated login failures (credential stuffing)
 * - Endpoint scanning (many distinct paths)
 * - Privilege escalation attempts
 *
 * Integrates with monitor.trackSecurity() and auditTrail.track() — fail-open.
 */

import { SECURITY_CONFIG } from "./securityConfig"
import { monitor } from "@/lib/monitoring/monitor"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"
import { auditTrail } from "@/lib/audit/auditTrail"
import { AUDIT_EVENT_STATUS, AUDIT_EVENT_SEVERITY } from "@/lib/audit/auditConstants"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThreatLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface ThreatReport {
  level: ThreatLevel
  signals: string[]
  actorId?: string
  ip?: string
  timestamp: number
}

// ─── Internal Signal Tracking ─────────────────────────────────────────────────

interface SignalWindow {
  permissionDenied: number[]
  loginFail: number[]
  requestBurst: number[]
  endpoints: Set<string>
  escalationAttempts: number
}

const signalStore = new Map<string, SignalWindow>()
let lastCleanup = Date.now()

function getWindow(key: string): SignalWindow {
  if (!signalStore.has(key)) {
    signalStore.set(key, {
      permissionDenied: [],
      loginFail: [],
      requestBurst: [],
      endpoints: new Set(),
      escalationAttempts: 0,
    })
  }
  return signalStore.get(key)!
}

function pruneWindow(win: SignalWindow): void {
  const cutoff = Date.now() - SECURITY_CONFIG.threat.windowMs
  win.permissionDenied = win.permissionDenied.filter(t => t > cutoff)
  win.loginFail = win.loginFail.filter(t => t > cutoff)
  win.requestBurst = win.requestBurst.filter(t => t > cutoff)
}

function maybeCleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < 120_000) return
  lastCleanup = now
  for (const [key, win] of signalStore.entries()) {
    pruneWindow(win)
    if (
      win.permissionDenied.length === 0 &&
      win.loginFail.length === 0 &&
      win.requestBurst.length === 0 &&
      win.endpoints.size === 0 &&
      win.escalationAttempts === 0
    ) {
      signalStore.delete(key)
    }
  }
}

// ─── Signal Recording ─────────────────────────────────────────────────────────

export function recordPermissionDenied(actorKey: string): void {
  try {
    const win = getWindow(actorKey)
    win.permissionDenied.push(Date.now())
    pruneWindow(win)
  } catch { /* fail-open */ }
}

export function recordLoginFail(actorKey: string): void {
  try {
    const win = getWindow(actorKey)
    win.loginFail.push(Date.now())
    pruneWindow(win)
  } catch { /* fail-open */ }
}

export function recordRequest(actorKey: string, endpoint?: string): void {
  try {
    const win = getWindow(actorKey)
    win.requestBurst.push(Date.now())
    if (endpoint) win.endpoints.add(endpoint)
    pruneWindow(win)
  } catch { /* fail-open */ }
}

export function recordPrivilegeEscalation(actorKey: string): void {
  try {
    const win = getWindow(actorKey)
    win.escalationAttempts++
  } catch { /* fail-open */ }
}

// ─── Threat Assessment ────────────────────────────────────────────────────────

/**
 * Evaluates the current threat level for a given actor/IP key.
 * Optionally fires monitoring and audit events for MEDIUM+ threats.
 */
export function assessThreat(
  actorKey: string,
  options?: { actorId?: string; ip?: string; fireEvents?: boolean },
): ThreatReport {
  try {
    maybeCleanup()
    const win = getWindow(actorKey)
    pruneWindow(win)

    const { threat } = SECURITY_CONFIG
    const signals: string[] = []
    let score = 0

    if (win.permissionDenied.length >= threat.permissionDeniedThreshold) {
      signals.push(`PERMISSION_DENIED_BURST(${win.permissionDenied.length})`)
      score += 2
    }

    if (win.loginFail.length >= threat.loginFailThreshold) {
      signals.push(`LOGIN_FAIL_BURST(${win.loginFail.length})`)
      score += 2
    }

    if (win.requestBurst.length >= threat.requestBurstThreshold) {
      signals.push(`REQUEST_BURST(${win.requestBurst.length})`)
      score += 1
    }

    if (win.endpoints.size >= threat.scanThreshold) {
      signals.push(`ENDPOINT_SCANNING(${win.endpoints.size} distinct)`)
      score += 3
    }

    if (win.escalationAttempts > 0) {
      signals.push(`PRIVILEGE_ESCALATION(${win.escalationAttempts})`)
      score += 4
    }

    let level: ThreatLevel = "LOW"
    if (score >= 8) level = "CRITICAL"
    else if (score >= 5) level = "HIGH"
    else if (score >= 2) level = "MEDIUM"

    const report: ThreatReport = {
      level,
      signals,
      actorId: options?.actorId,
      ip: options?.ip,
      timestamp: Date.now(),
    }

    if (options?.fireEvents && level !== "LOW") {
      const severity =
        level === "CRITICAL" ? MONITORING_CONSTANTS.SEVERITY.CRITICAL
        : level === "HIGH"   ? MONITORING_CONSTANTS.SEVERITY.ERROR
        :                      MONITORING_CONSTANTS.SEVERITY.WARNING

      // Monitoring layer (developer view) — map to closest allowed event type
      monitor.trackSecurity({
        category: MONITORING_CONSTANTS.CATEGORY.SECURITY,
        event: "FORBIDDEN",  // closest allowed type; signals array carries full detail
        severity,
        module: "ThreatDetector",
        action: "assessThreat",
        userId: options?.actorId,
        requestId: actorKey,
        errorCode: level,
      })

      // Audit layer (admin view) — fire and forget
      auditTrail.track({
        action: "SUSPICIOUS_ACTIVITY",
        module: "ThreatDetector",
        entity: "SecurityEvent",
        actorId: options?.actorId ?? null,
        status: AUDIT_EVENT_STATUS.FAILURE,
        severity: level === "CRITICAL" ? AUDIT_EVENT_SEVERITY.CRITICAL : AUDIT_EVENT_SEVERITY.WARNING,
        metadata: {
          requestId: actorKey,
          signals,
          threatLevel: level,
          description: `Suspicious activity detected: ${signals.join(", ")}`,
        },
        timestamp: Date.now(),
      }).catch(() => {})
    }

    return report
  } catch {
    return { level: "LOW", signals: [], timestamp: Date.now() }
  }
}
