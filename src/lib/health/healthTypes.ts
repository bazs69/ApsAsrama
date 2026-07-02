/**
 * Health Check Types
 *
 * Defines the core interfaces for the Enterprise Health Platform.
 * These types are consumed by the Health Aggregator and ready for React consumption.
 */

export type HealthStatus = "HEALTHY" | "DEGRADED" | "UNHEALTHY"

export interface HealthCheckResult {
  name: string
  status: HealthStatus
  message: string
  durationMs: number
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface HealthReport {
  status: HealthStatus
  checks: HealthCheckResult[]
  uptime: number
  timestamp: number
  version: string
  environment: string
}

export interface SystemStatus {
  health: HealthReport
  diagnostics: DiagnosticsSummary
  runtime: RuntimeSnapshot
}

export interface DiagnosticsSummary {
  nodeVersion: string
  buildVersion: string
  environment: string
  activeFeatures: string[]
  securityModules: string[]
  monitoringModules: string[]
  auditModules: string[]
}

export interface RuntimeSnapshot {
  processUptime: number
  heapUsedMB: number
  heapTotalMB: number
  rssMB: number
  externalMB: number
  cpuUser: number
  cpuSystem: number
  platform: string
  arch: string
  pid: number
}
