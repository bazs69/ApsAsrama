/**
 * Mutation Defaults
 * 
 * Standard configuration for all mutations across the app.
 * Future expansion can include 'meta' for global error toasts etc.
 */

export const mutationDefaults = {
  // Most mutations shouldn't retry automatically on failure as they are non-idempotent operations
  retry: 0,
  
  // Pause mutation if offline, resume when back online
  networkMode: 'online' as const,
  
  // By default, mutations shouldn't throw error to Error Boundary to allow inline error handling
  throwOnError: false,
}
