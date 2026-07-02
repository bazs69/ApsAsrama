/**
 * Request Constants
 * 
 * Centralized magic numbers and strings for the Request Layer.
 */

export const REQUEST_CONSTANTS = {
  DEFAULT_TIMEOUT: 15000, // 15 seconds
  DEFAULT_RETRY: 2, // 2 retries on idempotent network failures
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  API_VERSION: 'v1.0.0',
  REQUEST_PREFIX: 'SP3',
  REQUEST_ID_HEADER: 'x-request-id',
} as const
