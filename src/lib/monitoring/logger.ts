/**
 * Monitoring Logger
 * 
 * Internal structured logger for the monitoring system.
 * Development: verbose output with full context.
 * Production: silent for info/warning, but always logs errors.
 */

import { type MonitoringEvent } from "./eventTypes"

const IS_DEV = process.env.NODE_ENV !== "production"

const formatLog = (level: string, event: MonitoringEvent | string, context?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString()
  const eventId = typeof event === "string" ? event : event.eventId
  const category = typeof event === "string" ? "GENERAL" : event.category
  const eventData = typeof event === "string" ? {} : event
  return { timestamp, level, eventId, category, ...eventData, ...context }
}

export const monitoringLogger = {
  logInfo: (event: MonitoringEvent, context?: Record<string, unknown>) => {
    if (IS_DEV) {
      console.log(`[MONITOR INFO]`, formatLog("INFO", event, context))
    }
    // Future: send to external sink if needed
  },

  logWarning: (event: MonitoringEvent, context?: Record<string, unknown>) => {
    if (IS_DEV) {
      console.warn(`[MONITOR WARN]`, formatLog("WARNING", event, context))
    }
    // Future: send to external sink
  },

  logError: (event: MonitoringEvent, error?: unknown, context?: Record<string, unknown>) => {
    // Always log errors regardless of environment
    console.error(`[MONITOR ERROR]`, formatLog("ERROR", event, context), error ?? "")
    // Future: Sentry.captureEvent(event)
  },

  logCritical: (event: MonitoringEvent, error?: unknown, context?: Record<string, unknown>) => {
    // Always log critical regardless of environment
    console.error(`[MONITOR CRITICAL]`, formatLog("CRITICAL", event, context), error ?? "")
    // Future: Sentry.captureException(error, { extra: { event } })
  },
}
