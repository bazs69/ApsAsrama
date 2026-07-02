/**
 * Diagnostics Formatter
 *
 * Converts raw diagnostics data into human-readable summaries.
 */

import type { DiagnosticsSummary, DiagnosticsFeature } from "./diagnosticsTypes"

/**
 * Formats a DiagnosticsSummary into a multiline string (useful for logs / CLI).
 */
export function formatDiagnostics(summary: DiagnosticsSummary): string {
  const lines: string[] = [
    `── System Diagnostics ──`,
    `Node:          ${summary.nodeVersion}`,
    `Build:         ${summary.buildVersion}`,
    `Environment:   ${summary.environment}`,
    `Features:      ${summary.activeFeatures.join(", ") || "none"}`,
    `Security:      ${summary.securityModules.join(", ") || "none"}`,
    `Monitoring:    ${summary.monitoringModules.join(", ") || "none"}`,
    `Audit:         ${summary.auditModules.join(", ") || "none"}`,
  ]
  return lines.join("\n")
}

/**
 * Formats a list of DiagnosticsFeatures into a table-friendly array.
 */
export function formatFeatureTable(features: DiagnosticsFeature[]): Array<{ feature: string; status: string; version: string }> {
  return features.map(f => ({
    feature: f.name,
    status: f.enabled ? "ENABLED" : "DISABLED",
    version: f.version ?? "-",
  }))
}
