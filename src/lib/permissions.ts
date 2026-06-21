import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

export async function hasPermission(action: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return false

  return session.user.permissions?.includes(action) || false
}

export async function requirePermission(action: string) {
  const hasPerm = await hasPermission(action)
  if (!hasPerm) {
    throw new Error(`Forbidden: You don't have permission to perform ${action}`)
  }
}

export function hasPermissionClient(permissions: string[], action: string): boolean {
  return permissions.includes(action)
}
