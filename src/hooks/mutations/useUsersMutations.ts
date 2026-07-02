import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createUser, updateUser, deleteUser } from "@/app/actions/settings"
import { cacheUtils } from "@/lib/cacheUtils"
import { mutationDefaults } from "@/lib/mutationDefaults"
import { mutationKeys } from "@/lib/mutationKeys"
import { monitor } from "@/lib/monitoring/monitor"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"

/**
 * useUsersMutations
 * 
 * Centralizes all mutations related to the Users domain.
 * Automatically invalidates the "users" query key on success
 * so that React Query refetches the fresh data in the background.
 * Integrated with monitoring layer for trackMutation observability.
 */
export function useUsersMutations() {
  const queryClient = useQueryClient()

  // Invalidate all user queries on success and await the refetch
  // This ensures the transition stays active until fresh data is in cache,
  // preventing the Optimistic UI from flickering back to old data.
  const onSuccess = () => {
    return cacheUtils.invalidateUsers(queryClient)
  }

  const createMutation = useMutation({
    mutationKey: mutationKeys.users.create(),
    mutationFn: (payload: Parameters<typeof createUser>[0]) => createUser(payload),
    ...mutationDefaults,
    onSuccess: (data) => {
      monitor.trackMutation({
        category: MONITORING_CONSTANTS.CATEGORY.MUTATION,
        severity: data.error ? MONITORING_CONSTANTS.SEVERITY.ERROR : MONITORING_CONSTANTS.SEVERITY.INFO,
        mutationKey: "users.create",
        module: "Users",
        action: "CREATE",
        success: !data.error,
      })
      return onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationKey: mutationKeys.users.update(),
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateUser>[1] }) => updateUser(id, payload),
    ...mutationDefaults,
    onSuccess: (data) => {
      monitor.trackMutation({
        category: MONITORING_CONSTANTS.CATEGORY.MUTATION,
        severity: data.error ? MONITORING_CONSTANTS.SEVERITY.ERROR : MONITORING_CONSTANTS.SEVERITY.INFO,
        mutationKey: "users.update",
        module: "Users",
        action: "UPDATE",
        success: !data.error,
      })
      return onSuccess()
    },
  })

  const deleteMutation = useMutation({
    mutationKey: mutationKeys.users.delete(),
    mutationFn: (id: string) => deleteUser(id),
    ...mutationDefaults,
    onSuccess: (data) => {
      monitor.trackMutation({
        category: MONITORING_CONSTANTS.CATEGORY.MUTATION,
        severity: data.error ? MONITORING_CONSTANTS.SEVERITY.ERROR : MONITORING_CONSTANTS.SEVERITY.INFO,
        mutationKey: "users.delete",
        module: "Users",
        action: "DELETE",
        success: !data.error,
      })
      return onSuccess()
    },
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
