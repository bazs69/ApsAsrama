/**
 * Monitoring Constants
 * 
 * Single source of truth for all monitoring strings and enums.
 * No magic strings allowed anywhere else in the monitoring layer.
 */

export type MonitoringSeverity = "info" | "warning" | "error" | "critical"

export type EventCategory =
  | "USER"
  | "REQUEST"
  | "MUTATION"
  | "ERROR"
  | "NAVIGATION"
  | "AUTH"
  | "SECURITY"

export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL"

export const MONITORING_CONSTANTS = {
  VERSION: "1.0.0",
  EVENT_PREFIX: "EVT",
  MAX_BREADCRUMBS: 50, // Prevent memory bloat in long sessions
  
  SEVERITY: {
    INFO: "info" as const,
    WARNING: "warning" as const,
    ERROR: "error" as const,
    CRITICAL: "critical" as const,
  },

  LOG_LEVEL: {
    DEBUG: "DEBUG" as const,
    INFO: "INFO" as const,
    WARNING: "WARNING" as const,
    ERROR: "ERROR" as const,
    CRITICAL: "CRITICAL" as const,
  },

  CATEGORY: {
    USER: "USER" as const,
    REQUEST: "REQUEST" as const,
    MUTATION: "MUTATION" as const,
    ERROR: "ERROR" as const,
    NAVIGATION: "NAVIGATION" as const,
    AUTH: "AUTH" as const,
    SECURITY: "SECURITY" as const,
  },
} as const
