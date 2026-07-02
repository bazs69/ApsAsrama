/**
 * Mutation Keys Factory
 * 
 * Centralizes all React Query mutation keys.
 * Useful if we ever need to use `useIsMutating` to show a global loading state.
 */

export const mutationKeys = {
  users: {
    all: () => ["mutations", "users"] as const,
    create: () => [...mutationKeys.users.all(), "create"] as const,
    update: () => [...mutationKeys.users.all(), "update"] as const,
    delete: () => [...mutationKeys.users.all(), "delete"] as const,
  },
  
  roles: {
    all: () => ["mutations", "roles"] as const,
    update: () => [...mutationKeys.roles.all(), "update"] as const,
  },

  assignment: {
    all: () => ["mutations", "assignment"] as const,
    create: () => [...mutationKeys.assignment.all(), "create"] as const,
  },
}
