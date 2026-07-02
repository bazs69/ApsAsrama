/**
 * Request Logger
 * 
 * Standardized logging for all requests.
 * Safely disables or minifies output in production to avoid spam.
 */

import { type RequestMetadata } from "./requestTypes"

export const requestLogger = {
  logStart: (metadata: RequestMetadata, contextMsg?: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[REQ START] [${metadata.requestId}] ${metadata.module || 'UnknownModule'}::${metadata.action || 'UnknownAction'} ${contextMsg ? `- ${contextMsg}` : ''}`)
    }
  },

  logSuccess: (metadata: RequestMetadata, contextMsg?: string) => {
    if (process.env.NODE_ENV !== "production") {
      const ms = metadata.duration ? `${metadata.duration}ms` : 'unknown time'
      console.log(`[REQ OK]    [${metadata.requestId}] ${metadata.module || 'UnknownModule'}::${metadata.action || 'UnknownAction'} in ${ms} ${contextMsg ? `- ${contextMsg}` : ''}`)
    }
  },

  logError: (metadata: RequestMetadata, error: unknown, contextMsg?: string) => {
    // We log errors even in production, but we might want to pipe them to Sentry here later
    const ms = metadata.duration ? `${metadata.duration}ms` : 'unknown time'
    console.error(`[REQ FAIL]  [${metadata.requestId}] ${metadata.module || 'UnknownModule'}::${metadata.action || 'UnknownAction'} in ${ms} ${contextMsg ? `- ${contextMsg}` : ''}`, error)
  }
}
