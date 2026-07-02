import type { NotificationPriority, NotificationSeverity } from "./notificationTypes"
import type { HealthStatus } from "@/lib/health/healthTypes"
import type { ThreatLevel } from "@/lib/security/threatDetector"

export function getHealthPriority(status: HealthStatus): { priority: NotificationPriority, severity: NotificationSeverity } {
  switch (status) {
    case "UNHEALTHY": return { priority: "CRITICAL", severity: "CRITICAL" }
    case "DEGRADED": return { priority: "HIGH", severity: "WARNING" }
    case "HEALTHY":
    default: return { priority: "LOW", severity: "INFO" }
  }
}

export function getSecurityPriority(level: ThreatLevel): { priority: NotificationPriority, severity: NotificationSeverity } {
  switch (level) {
    case "CRITICAL": return { priority: "CRITICAL", severity: "CRITICAL" }
    case "HIGH": return { priority: "HIGH", severity: "ERROR" }
    case "MEDIUM": return { priority: "MEDIUM", severity: "WARNING" }
    case "LOW":
    default: return { priority: "LOW", severity: "INFO" }
  }
}

export function getRuntimePriority(memoryPercent: number, cpuPercent: number): { priority: NotificationPriority, severity: NotificationSeverity } {
  if (memoryPercent >= 95 || cpuPercent >= 95) return { priority: "CRITICAL", severity: "CRITICAL" }
  if (memoryPercent >= 85 || cpuPercent >= 85) return { priority: "HIGH", severity: "ERROR" }
  if (memoryPercent >= 75 || cpuPercent >= 75) return { priority: "MEDIUM", severity: "WARNING" }
  return { priority: "LOW", severity: "INFO" }
}

export function getMonitoringPriority(type: "ERROR" | "WARNING" | "INFO"): { priority: NotificationPriority, severity: NotificationSeverity } {
  switch (type) {
    case "ERROR": return { priority: "HIGH", severity: "ERROR" }
    case "WARNING": return { priority: "MEDIUM", severity: "WARNING" }
    case "INFO":
    default: return { priority: "LOW", severity: "INFO" }
  }
}

export function getAuditPriority(action: string, status: string): { priority: NotificationPriority, severity: NotificationSeverity } {
  if (status === "FAILURE") {
    if (action.includes("DELETE") || action.includes("UPDATE")) return { priority: "HIGH", severity: "ERROR" }
    return { priority: "MEDIUM", severity: "WARNING" }
  }
  return { priority: "LOW", severity: "INFO" }
}
