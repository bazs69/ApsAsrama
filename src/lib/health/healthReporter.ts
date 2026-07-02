/**
 * Health Reporter
 *
 * Formats health data into objects ready for React or API consumption.
 * No UI logic — purely data transformation.
 */

import type { HealthReport, SystemStatus, DiagnosticsSummary, RuntimeSnapshot } from "./healthTypes"
import { runHealthChecks } from "./healthAggregator"
import { getDiagnosticsSummary } from "@/lib/diagnostics/diagnostics"
import { getRuntimeSnapshot } from "@/lib/runtime/runtimeSnapshot"

/**
 * Produces a full SystemStatus object combining health, diagnostics, and runtime.
 * Ready for direct serialisation into a React Server Component or API response.
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const [health, diagnostics, runtime] = await Promise.all([
    runHealthChecks(),
    Promise.resolve(getDiagnosticsSummary()),
    Promise.resolve(getRuntimeSnapshot()),
  ])

  return { health, diagnostics, runtime }
}

/**
 * Produces only the HealthReport portion (lighter weight).
 */
export async function getHealthReport(): Promise<HealthReport> {
  return runHealthChecks()
}

/**
 * Returns diagnostics only (sync).
 */
export function getDiagnosticsReport(): DiagnosticsSummary {
  return getDiagnosticsSummary()
}

/**
 * Returns runtime snapshot only (sync).
 */
export function getRuntimeReport(): RuntimeSnapshot {
  return getRuntimeSnapshot()
}
