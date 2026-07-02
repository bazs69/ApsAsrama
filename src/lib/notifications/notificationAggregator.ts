import prisma from "@/lib/prisma"
import type { Notification } from "./notificationTypes"
import { getHealthReport } from "@/lib/health/healthReporter"
import { getMetricsSnapshot } from "@/lib/security/securityMetrics"
import { breadcrumbStore } from "@/lib/monitoring/breadcrumb"
import { 
  getHealthPriority, 
  getSecurityPriority, 
  getRuntimePriority, 
  getMonitoringPriority,
  getAuditPriority
} from "./notificationPriorities"
import { formatEventTitle, formatEventDescription } from "./notificationFormatter"
import { NOTIFICATION_CONSTANTS } from "./notificationConstants"

// Simple id generator for in-memory alerts
const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 9)}`

export async function aggregateNotifications(): Promise<Notification[]> {
  const notifications: Notification[] = []

  // 1. HEALTH
  try {
    const health = await getHealthReport()
    if (health.status !== "HEALTHY") {
      const { priority, severity } = getHealthPriority(health.status)
      notifications.push({
        id: generateId("hlth"),
        category: "HEALTH",
        title: `System Health ${health.status}`,
        description: `System is currently in a ${health.status.toLowerCase()} state. Some checks failed.`,
        severity,
        priority,
        createdAt: health.timestamp,
        source: "HealthPlatform",
        isRead: false
      })
      
      // Also add failing checks as individual alerts if critical
      for (const check of health.checks) {
        if (check.status !== "HEALTHY") {
          notifications.push({
            id: generateId("hlchk"),
            category: "HEALTH",
            title: `Health Check Failed: ${check.name}`,
            description: check.message,
            severity: check.status === "UNHEALTHY" ? "CRITICAL" : "WARNING",
            priority: check.status === "UNHEALTHY" ? "CRITICAL" : "HIGH",
            createdAt: check.timestamp,
            source: check.name,
            isRead: false
          })
        }
      }
    }
  } catch (e) {
    // Ignore fail-open
  }

  // 2. SECURITY
  try {
    const secMetrics = getMetricsSnapshot()
    for (const [key, count] of Object.entries(secMetrics)) {
      if (count > 0) {
        // basic mapping
        const isCritical = key === "failed_login" && count > 50 || key === "brute_force_blocked"
        const isHigh = key === "blocked_request" || key === "suspicious_event"
        
        notifications.push({
          id: generateId("sec"),
          category: "SECURITY",
          title: formatEventTitle(key),
          description: `Detected ${count} instances of ${formatEventTitle(key)} in the current retention window.`,
          severity: isCritical ? "CRITICAL" : isHigh ? "ERROR" : "WARNING",
          priority: isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM",
          createdAt: Date.now(), // Real event time would be in threat detector, we use now for aggregate metric
          source: "SecurityMetrics",
          isRead: false
        })
      }
    }
  } catch (e) {
    // Ignore
  }

  // 3. RUNTIME
  try {
    const runtime = (await import("@/lib/runtime/runtimeSnapshot")).getRuntimeSnapshot()
    // For runtime, memory percent calculation
    // Since heapTotal is just allocated, let's use rss relative to a typical max e.g. 1024MB or 2048MB
    const memoryPercent = (runtime.rssMB / 2048) * 100 
    const cpuPercent = 0 // without interval calculation we can't easily get cpu, assume 0 for static
    
    if (memoryPercent > 75) {
      const { priority, severity } = getRuntimePriority(memoryPercent, cpuPercent)
      notifications.push({
        id: generateId("rt"),
        category: "RUNTIME",
        title: "High Memory Usage",
        description: `Resident Set Size (RSS) is at ${runtime.rssMB} MB (${memoryPercent.toFixed(1)}% of 2GB).`,
        severity,
        priority,
        createdAt: Date.now(),
        source: "RuntimeMonitor",
        isRead: false
      })
    }
  } catch (e) {}

  // 4. MONITORING
  try {
    const crumbs = breadcrumbStore.getAll()
    const errorCrumbs = crumbs.filter(c => c.severity === "error" || c.severity === "critical")
    for (const crumb of errorCrumbs) {
      const { priority, severity } = getMonitoringPriority("ERROR")
      notifications.push({
        id: generateId("mon"),
        category: "MONITORING",
        title: formatEventTitle(crumb.category),
        description: crumb.message,
        severity,
        priority,
        createdAt: crumb.timestamp,
        source: crumb.category,
        isRead: false
      })
    }
  } catch (e) {}

  // 5. AUDIT
  try {
    // Fetch last 20 failed or critical audit events
    const recentAuditFails = await prisma.securityEvent.findMany({
      where: {
        OR: [
          { metadata: { path: ["status"], equals: "FAILURE" } },
          { metadata: { path: ["severity"], equals: "CRITICAL" } },
          { metadata: { path: ["severity"], equals: "HIGH" } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    for (const audit of recentAuditFails) {
      const meta = audit.metadata as Record<string, unknown> || {}
      const status = (meta.status as string) || "UNKNOWN"
      const { priority, severity } = getAuditPriority(audit.action, status)
      
      const metaSeverity = meta.severity as string | undefined
      const finalSeverity = (metaSeverity === "CRITICAL" || metaSeverity === "ERROR" || metaSeverity === "WARNING" || metaSeverity === "INFO") ? metaSeverity : severity

      notifications.push({
        id: audit.id,
        category: "AUDIT",
        title: formatEventTitle(audit.action),
        description: formatEventDescription(`Audit Event: ${audit.action} on ${audit.resource}`, { user: audit.actorId || "System", ipAddress: audit.ipAddress }),
        severity: finalSeverity,
        priority,
        createdAt: audit.createdAt.getTime(),
        source: "AuditLayer",
        isRead: false
      })
    }
  } catch (e) {
    // Ignore DB error fail open
  }

  // Sort all aggregated by newest
  return notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, NOTIFICATION_CONSTANTS.MAX_NOTIFICATIONS)
}
