/**
 * Monitoring Adapter Interface
 * 
 * Defines the contract that all monitoring adapters must implement.
 * This decouples the monitoring client from any specific external service.
 * Swap out ConsoleAdapter for SentryAdapter or OpenTelemetryAdapter in the future.
 */

import { type MonitoringEvent } from "../eventTypes"

export interface MonitoringAdapter {
  name: string
  send: (event: MonitoringEvent) => void
  flush?: () => Promise<void> // Optional: batch sends
}
