/**
 * Health Aggregator
 *
 * Runs all registered health checks, determines aggregate status,
 * and integrates with Monitoring and Audit layers on state transitions.
 *
 * Design:
 * - Worst-case wins: if any check is UNHEALTHY the aggregate is UNHEALTHY.
 * - State transitions (HEALTHY ↔ UNHEALTHY) fire monitor + audit events.
 * - Fail-open: a check that throws is reported as UNHEALTHY — never crashes.
 */

import type { HealthCheckResult, HealthReport, HealthStatus } from "./healthTypes"
import { HEALTH_CONSTANTS } from "./healthConstants"
import {
  checkDatabase,
  checkPrismaConnection,
  checkMemory,
  checkUptime,
  checkNodeVersion,
  checkEnvironment,
  checkRequestLayer,
  checkMonitoring,
} from "./healthChecks"
import { monitor } from "@/lib/monitoring/monitor"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"
import { auditTrail } from "@/lib/audit/auditTrail"
import { AUDIT_EVENT_STATUS, AUDIT_EVENT_SEVERITY } from "@/lib/audit/auditConstants"

// Track the previous aggregate status for transition detection
let previousStatus: HealthStatus = "HEALTHY"
const startTime = Date.now()

/**
 * Determines the worst-case aggregate status from individual results.
 */
function aggregateStatus(checks: HealthCheckResult[]): HealthStatus {
  if (checks.some(c => c.status === "UNHEALTHY")) return "UNHEALTHY"
  if (checks.some(c => c.status === "DEGRADED")) return "DEGRADED"
  return "HEALTHY"
}

/**
 * Fires monitoring + audit events when aggregate status transitions.
 */
function handleTransition(
  from: HealthStatus,
  to: HealthStatus,
  checks: HealthCheckResult[],
): void {
  if (from === to) return

  const failedChecks = checks.filter(c => c.status !== "HEALTHY")

  // Monitoring event (developer view)
  monitor.trackError({
    category: MONITORING_CONSTANTS.CATEGORY.ERROR,
    severity: to === "UNHEALTHY" ? MONITORING_CONSTANTS.SEVERITY.CRITICAL : MONITORING_CONSTANTS.SEVERITY.WARNING,
    code: `HEALTH_${to}`,
    message: `System health changed: ${from} → ${to}`,
    module: "HealthAggregator",
    context: {
      failedChecks: failedChecks.map(c => ({ name: c.name, status: c.status, message: c.message })),
    },
  })

  // Audit event (admin view)
  auditTrail.track({
    action: "SYSTEM_CONFIGURATION_CHANGED",
    module: "Health",
    entity: "SystemHealth",
    actorId: null,
    status: to === "HEALTHY" ? AUDIT_EVENT_STATUS.SUCCESS : AUDIT_EVENT_STATUS.FAILURE,
    severity: to === "UNHEALTHY" ? AUDIT_EVENT_SEVERITY.CRITICAL : AUDIT_EVENT_SEVERITY.WARNING,
    metadata: {
      requestId: `health-${Date.now()}`,
      description: `System health changed: ${from} → ${to}`,
      oldValue: from,
      newValue: to,
    },
    timestamp: Date.now(),
  }).catch(() => {})
}

/**
 * Runs all health checks and returns a complete HealthReport.
 * Safe to call frequently — individual checks are non-destructive.
 */
export async function runHealthChecks(): Promise<HealthReport> {
  // Run async and sync checks in parallel where possible
  const [dbResult, prismaResult] = await Promise.all([
    checkDatabase().catch((err): HealthCheckResult => ({
      name: HEALTH_CONSTANTS.CHECK_NAMES.DATABASE,
      status: "UNHEALTHY",
      message: err instanceof Error ? err.message : "Unknown error",
      durationMs: 0,
      timestamp: Date.now(),
    })),
    checkPrismaConnection().catch((err): HealthCheckResult => ({
      name: HEALTH_CONSTANTS.CHECK_NAMES.PRISMA,
      status: "UNHEALTHY",
      message: err instanceof Error ? err.message : "Unknown error",
      durationMs: 0,
      timestamp: Date.now(),
    })),
  ])

  const syncChecks: HealthCheckResult[] = [
    checkMemory(),
    checkUptime(),
    checkNodeVersion(),
    checkEnvironment(),
    checkRequestLayer(),
    checkMonitoring(),
  ]

  const allChecks = [dbResult, prismaResult, ...syncChecks]
  const currentStatus = aggregateStatus(allChecks)

  // Detect state transitions
  handleTransition(previousStatus, currentStatus, allChecks)
  previousStatus = currentStatus

  return {
    status: currentStatus,
    checks: allChecks,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: Date.now(),
    version: HEALTH_CONSTANTS.VERSION,
    environment: process.env.NODE_ENV ?? "development",
  }
}

/** Returns the last known aggregate status without re-running checks. */
export function getLastKnownStatus(): HealthStatus {
  return previousStatus
}
