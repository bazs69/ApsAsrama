/**
 * Breadcrumb Foundation
 * 
 * In-memory store for chronological activity trail.
 * Useful for debugging — shows the path the user took before an error occurred.
 * 
 * Future: can be persisted to localStorage or sent to Sentry as breadcrumbs.
 */

import { MONITORING_CONSTANTS } from "./constants"
import { type EventCategory, type MonitoringSeverity } from "./constants"

export interface Breadcrumb {
  timestamp: number
  category: EventCategory | "GENERAL"
  message: string
  severity: MonitoringSeverity
  data?: Record<string, unknown>
}

// Module-level in-memory store
const breadcrumbs: Breadcrumb[] = []

export const breadcrumbStore = {
  add: (crumb: Omit<Breadcrumb, "timestamp">) => {
    breadcrumbs.push({ ...crumb, timestamp: Date.now() })
    // Keep max N breadcrumbs to prevent memory bloat
    if (breadcrumbs.length > MONITORING_CONSTANTS.MAX_BREADCRUMBS) {
      breadcrumbs.shift()
    }
  },

  getAll: (): readonly Breadcrumb[] => [...breadcrumbs],

  getLast: (count: number): readonly Breadcrumb[] =>
    breadcrumbs.slice(-count),

  clear: () => {
    breadcrumbs.length = 0
  },
}
