/**
 * Event ID Generator
 * 
 * Generates a unique traceable ID for every monitoring event.
 * Format: EVT-<uuid>
 */

import { MONITORING_CONSTANTS } from "./constants"

export function generateEventId(): string {
  let uuid = ""

  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    uuid = crypto.randomUUID()
  } else {
    // Fallback for older environments
    uuid =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10)
  }

  return `${MONITORING_CONSTANTS.EVENT_PREFIX}-${uuid}`
}
