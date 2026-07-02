/**
 * Monitoring Adapter
 * 
 * Abstraction layer for monitoring. Currently forwards to the internal monitor.
 * In Production V2, this will be swapped to external services like Datadog, Sentry, or OpenTelemetry.
 */
import { monitor } from "./monitor"
import type { ErrorEvent, SecurityEvent, MutationEvent, RequestEvent, UserEvent, NavigationEvent, AuthenticationEvent } from "./eventTypes"

export const monitorAdapter = {
  trackError: (payload: Omit<ErrorEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackError(payload)
  },
  trackWarning: (payload: Omit<ErrorEvent, "eventId" | "timestamp" | "version">) => {
    // Current monitor.ts doesn't have an explicit trackWarning, but trackError supports severity
    monitor.trackError({ ...payload, severity: "warning" })
  },
  trackInfo: (payload: Omit<UserEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackEvent(payload)
  },
  // We can forward other events as needed, or expose them
  trackSecurity: (payload: Omit<SecurityEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackSecurity(payload)
  },
  trackMutation: (payload: Omit<MutationEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackMutation(payload)
  },
  trackRequest: (payload: Omit<RequestEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackRequest(payload)
  },
  trackNavigation: (payload: Omit<NavigationEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackNavigation(payload)
  },
  trackAuth: (payload: Omit<AuthenticationEvent, "eventId" | "timestamp" | "version">) => {
    monitor.trackAuth(payload)
  }
}
