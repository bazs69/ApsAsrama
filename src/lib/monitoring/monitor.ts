/**
 * Monitoring Client (monitor.ts)
 * 
 * The single public API for the entire monitoring system.
 * All application code should call THIS file, never individual loggers directly.
 * 
 * Architecture: monitor.ts → adapters[] → ConsoleAdapter (now) / SentryAdapter (future)
 */

import { MONITORING_CONSTANTS } from "./constants"
import { generateEventId } from "./eventId"
import { breadcrumbStore } from "./breadcrumb"
import { ConsoleAdapter } from "./adapters/ConsoleAdapter"
import { type MonitoringAdapter } from "./adapters/MonitoringAdapter"
import {
  type UserEvent,
  type RequestEvent,
  type MutationEvent,
  type ErrorEvent,
  type NavigationEvent,
  type AuthenticationEvent,
  type SecurityEvent,
} from "./eventTypes"

// Adapter registry — add SentryAdapter, DatadogAdapter etc. here later
const adapters: MonitoringAdapter[] = [ConsoleAdapter]

// Send an event to all registered adapters
function dispatch<T extends { eventId: string; category: string; severity: string }>(event: T) {
  for (const adapter of adapters) {
    try {
      adapter.send(event as never)
    } catch {
      // Monitoring must NEVER crash the app
    }
  }
}

export const monitor = {
  /**
   * Register an additional adapter (e.g., SentryAdapter in the future)
   */
  registerAdapter: (adapter: MonitoringAdapter) => {
    adapters.push(adapter)
  },

  trackEvent: (payload: Omit<UserEvent, "eventId" | "timestamp" | "version">) => {
    const event: UserEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `User: ${event.action}`,
      severity: event.severity,
      data: event.metadata,
    })
    dispatch(event)
  },

  trackRequest: (payload: Omit<RequestEvent, "eventId" | "timestamp" | "version">) => {
    const event: RequestEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `Request: ${event.module}::${event.action} (${event.success ? "OK" : "FAIL"}) ${event.durationMs}ms`,
      severity: event.severity,
    })
    dispatch(event)
  },

  trackMutation: (payload: Omit<MutationEvent, "eventId" | "timestamp" | "version">) => {
    const event: MutationEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `Mutation: ${event.module}::${event.action} (${event.success ? "OK" : "FAIL"})`,
      severity: event.severity,
    })
    dispatch(event)
  },

  trackError: (payload: Omit<ErrorEvent, "eventId" | "timestamp" | "version">) => {
    const event: ErrorEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `Error [${event.code}]: ${event.message}`,
      severity: event.severity,
    })
    dispatch(event)
  },

  trackNavigation: (payload: Omit<NavigationEvent, "eventId" | "timestamp" | "version">) => {
    const event: NavigationEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `Navigate: ${event.fromPath ?? "?"} → ${event.toPath}`,
      severity: event.severity,
    })
    dispatch(event)
  },

  trackAuth: (payload: Omit<AuthenticationEvent, "eventId" | "timestamp" | "version">) => {
    const event: AuthenticationEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `Auth: ${event.action} (${event.success ? "OK" : "FAIL"})`,
      severity: event.severity,
    })
    dispatch(event)
  },

  trackSecurity: (payload: Omit<SecurityEvent, "eventId" | "timestamp" | "version">) => {
    const event: SecurityEvent = {
      ...payload,
      eventId: generateEventId(),
      timestamp: Date.now(),
      version: MONITORING_CONSTANTS.VERSION,
    }
    breadcrumbStore.add({
      category: event.category,
      message: `Security [${event.event}]: ${event.module ?? "?"}::${event.action ?? "?"} ${event.errorCode ? `(${event.errorCode})` : ""}`,
      severity: event.severity,
    })
    dispatch(event)
  },
}
