/**
 * Cache Utils
 * 
 * Centralized helpers for cache invalidation.
 * Provides a cleaner API for mutating hooks.
 */

import { type QueryClient } from "@tanstack/react-query"
import { queryKeys } from "./queryKeys"

export const cacheUtils = {
  invalidateUsers: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
  },
  
  invalidateRoles: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() })
  },
  
  invalidateSatker: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.satker.all() })
  },
  
  // Future usage
  invalidateDashboard: (_queryClient: QueryClient) => {
    // return _queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() })
    return Promise.resolve()
  },
  
  invalidateAll: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries()
  }
}
