export const NOTIFICATION_CONSTANTS = {
  CATEGORIES: {
    HEALTH: "HEALTH",
    SECURITY: "SECURITY",
    MONITORING: "MONITORING",
    AUDIT: "AUDIT",
    RUNTIME: "RUNTIME",
    SYSTEM: "SYSTEM"
  },
  SEVERITY: {
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
    CRITICAL: "CRITICAL"
  },
  PRIORITY: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL"
  },
  MAX_NOTIFICATIONS: 100 // Hard limit for display performance
} as const
