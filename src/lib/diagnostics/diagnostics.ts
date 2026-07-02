/**
 * Diagnostics
 *
 * Collects runtime, build, environment, and module information.
 * No side effects — purely informational.
 */

import type { DiagnosticsSummary } from "./diagnosticsTypes"
import { HEALTH_CONSTANTS } from "@/lib/health/healthConstants"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"

const BUILD_VERSION = process.env.BUILD_VERSION ?? "dev"

/**
 * Returns a complete diagnostics summary.
 * Designed for direct consumption by the Health Reporter and UI.
 */
export function getDiagnosticsSummary(): DiagnosticsSummary {
  return {
    nodeVersion: process.versions.node,
    buildVersion: BUILD_VERSION,
    environment: process.env.NODE_ENV ?? "development",
    activeFeatures: detectActiveFeatures(),
    securityModules: detectSecurityModules(),
    monitoringModules: detectMonitoringModules(),
    auditModules: detectAuditModules(),
  }
}

function detectActiveFeatures(): string[] {
  const features: string[] = [
    "Pagination",
    "Search",
    "Sorting",
    "OptimisticUI",
    "URLState",
    "TanStackQuery",
    "RBAC",
  ]
  return features
}

function detectSecurityModules(): string[] {
  return [
    `SecureAction (v${SECURITY_CONSTANTS.VERSION})`,
    "CSRF",
    "RateLimiter",
    "RateLimiterAdvanced",
    "BruteForce",
    "ReplayProtection",
    "ThreatDetector",
    "SecurityMetrics",
    "PasswordPolicy",
    "PermissionGuard",
  ]
}

function detectMonitoringModules(): string[] {
  return [
    `MonitorClient (v${MONITORING_CONSTANTS.VERSION})`,
    "ConsoleAdapter",
    "Breadcrumbs",
    "EventId",
  ]
}

function detectAuditModules(): string[] {
  return [
    `AuditTrail (v${HEALTH_CONSTANTS.VERSION})`,
    "DatabaseAdapter",
    "AuditFormatter",
    "AuditConstants",
  ]
}
