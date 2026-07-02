/**
 * Query Defaults
 * 
 * Single Source of Truth for all React Query configurations.
 * Prevents magic numbers and duplicate configs scattered across hooks.
 * 
 * Default configurations per module:
 * - staleTime: Time before data is considered stale and needs background refetch.
 * - gcTime: Time before inactive data is garbage collected from memory.
 * - retry: Number of times to retry failed requests.
 * - refetchOnWindowFocus: Whether to refetch when window regains focus.
 * - networkMode: 'online' (pause query if offline) or 'always' (fire anyway).
 */

const baseConfig = {
  retry: 2,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  networkMode: 'online' as const,
}

// 5 minutes stale, 10 minutes cache
const standardCache = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  ...baseConfig,
}

// 1 hour stale, 2 hours cache (for rarely changing data)
const longCache = {
  staleTime: 60 * 60 * 1000,
  gcTime: 2 * 60 * 60 * 1000,
  ...baseConfig,
}

// 1 minute stale, 5 minutes cache (for rapidly changing data like dashboard metrics)
const shortCache = {
  staleTime: 60 * 1000,
  gcTime: 5 * 60 * 1000,
  ...baseConfig,
}

export const queryDefaults = {
  users: standardCache,
  roles: longCache, // Roles rarely change
  permissions: longCache, // Permissions rarely change
  satker: longCache, // Satker list rarely changes
  dashboard: shortCache, // Dashboard needs fresh metrics
  announcement: standardCache,
  assignment: standardCache,
}
