/**
 * Query Keys Factory
 *
 * This file centralizes all React Query keys to avoid typos and ensure
 * consistency across the application. It uses a factory pattern to generate
 * standard key arrays for different scenarios.
 *
 * Example usage:
 * queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
 * useQuery({ queryKey: queryKeys.users.list(page, search), ... })
 */

export const queryKeys = {
  // Users module keys
  users: {
    all: () => ["users"] as const,
    lists: () => [...queryKeys.users.all(), "list"] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // Roles module keys
  roles: {
    all: () => ["roles"] as const,
    lists: () => [...queryKeys.roles.all(), "list"] as const,
  },

  // Satker module keys
  satker: {
    all: () => ["satker"] as const,
    lists: () => [...queryKeys.satker.all(), "list"] as const,
  },
  
  // We can add more domains here as the app grows
  // assignments: { ... }
  // reports: { ... }
}
