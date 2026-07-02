/**
 * Console Adapter
 * 
 * The default monitoring adapter. Routes all events to the internal monitoring logger.
 * Replace or extend with SentryAdapter/OpenTelemetryAdapter without changing monitor.ts.
 */

import { type MonitoringEvent } from "../eventTypes"
import { type MonitoringAdapter } from "./MonitoringAdapter"
import { monitoringLogger } from "../logger"

export const ConsoleAdapter: MonitoringAdapter = {
  name: "ConsoleAdapter",

  send: (event: MonitoringEvent) => {
    switch (event.severity) {
      case "info":
        monitoringLogger.logInfo(event)
        break
      case "warning":
        monitoringLogger.logWarning(event)
        break
      case "error":
        monitoringLogger.logError(event)
        break
      case "critical":
        monitoringLogger.logCritical(event)
        break
    }
  },
}
