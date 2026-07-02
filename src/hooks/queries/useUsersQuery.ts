import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { getUsers, type UserSortField, type SortOrder } from "@/app/actions/settings"
import { queryKeys } from "@/lib/queryKeys"

import { queryDefaults } from "@/lib/queryDefaults"

import { executeRequest } from "@/lib/request/requestClient"

export type GetUsersResult = Awaited<ReturnType<typeof getUsers>>

interface UseUsersQueryOptions {
  page: number
  pageSize: number
  search: string
  sort: UserSortField
  order: SortOrder
  initialData?: GetUsersResult
}

/**
 * useUsersQuery
 * 
 * Fetches the paginated list of users.
 * Uses keepPreviousData (React Query v5) to avoid flickering when changing pages or searching.
 * Now wrapped with Enterprise Request Layer.
 */
export function useUsersQuery({ page, pageSize, search, sort, order, initialData }: UseUsersQueryOptions) {
  return useQuery({
    queryKey: queryKeys.users.list({ page, pageSize, search, sort, order }),
    queryFn: async () => {
      // Direct call to Next.js Server Action, wrapped by our request layer
      const response = await executeRequest(
        async () => await getUsers(page, pageSize, search, sort, order),
        {
          module: "Users",
          action: "getUsers",
          isIdempotent: true,
        }
      )
      
      if (!response.success) {
        throw new Error(response.error.description)
      }
      
      return response.data
    },
    ...queryDefaults.users, // Inherit standard enterprise cache strategy
    
    // If we have SSR initial data and this is the EXACT first page query, use it.
    // However, to keep it simple and foolproof for pagination, we typically 
    // inject initialData only when it matches perfectly. 
    initialData: initialData,
    
    // placeholderData: keepPreviousData ensures that while fetching page 2, 
    // we still show page 1's data until page 2 arrives, avoiding a hard loading skeleton.
    placeholderData: keepPreviousData,
  })
}
