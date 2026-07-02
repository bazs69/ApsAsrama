/**
 * Request ID Generator
 * 
 * Generates a unique, traceable ID for every request.
 * Useful for logging, debugging, and tracing across microservices/Sentry/OpenTelemetry.
 */

import { REQUEST_CONSTANTS } from "./requestConstants"

export function generateRequestId(): string {
  // Use crypto.randomUUID if available (modern browsers & Node.js 14.17+)
  // Fallback to basic random string if somehow unavailable
  let uuid = ""
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    uuid = crypto.randomUUID()
  } else {
    // Fallback for older environments
    uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  
  // Format: SP3-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
  return `${REQUEST_CONSTANTS.REQUEST_PREFIX}-${uuid}`
}
