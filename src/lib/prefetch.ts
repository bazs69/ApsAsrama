/**
 * Prefetch Foundation
 * 
 * Provides helpers to prefetch data on the server or during hover states.
 * Pre-populates the cache so the next navigation feels completely instant.
 */

import { type QueryClient } from "@tanstack/react-query"
// import { queryKeys } from "./queryKeys"
// import { queryDefaults } from "./queryDefaults"

// E.g. import { getUsers } from "@/app/actions/settings"

export const prefetchUtils = {
  /**
   * Example: Prefetch a specific page of users.
   * Currently a structural foundation.
   */
  prefetchUsers: async (
    _queryClient: QueryClient, 
    _params: { page: number, pageSize: number, search: string, sort: unknown, order: unknown }
  ) => {
    // await _queryClient.prefetchQuery({
    //   queryKey: queryKeys.users.list(_params),
    //   queryFn: () => getUsers(_params.page, _params.pageSize, _params.search, _params.sort, _params.order),
    //   staleTime: queryDefaults.users.staleTime,
    // })
    return Promise.resolve()
  },

  // prefetchDashboard: async (...) => { ... }
}
