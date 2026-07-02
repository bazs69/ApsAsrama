/**
 * Diagnostics Types
 *
 * Type definitions for the diagnostics module.
 * Re-exports DiagnosticsSummary from healthTypes to keep a single source of truth.
 */

export type { DiagnosticsSummary } from "@/lib/health/healthTypes"

export interface DiagnosticsFeature {
  name: string
  enabled: boolean
  version?: string
}
