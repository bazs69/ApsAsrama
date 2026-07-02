/**
 * Centralized Authorization Helpers
 *
 * These helpers consolidate the repeated permission/role guard pattern
 * found across server actions into reusable functions.
 *
 * All helpers throw `new Error("Forbidden")` on failure — matching the
 * existing error contract used throughout the application.
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { PermissionCode } from "@/lib/security/permissions"

/**
 * Throws if the current session does not have the required permission.
 */
export async function requirePermission(permission: PermissionCode | string): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Forbidden")
  }
  if (session.user.role === "SUPER_ADMIN") return;
  const permissions = session.user.permissions ?? []
  if (!permissions.includes(permission)) {
    throw new Error("Forbidden")
  }
}

/**
 * Throws if the current session does not have at least one of the given permissions.
 */
export async function requireAnyPermission(permissions: (PermissionCode | string)[]): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Forbidden")
  }
  if (session.user.role === "SUPER_ADMIN") return;
  const userPerms = session.user.permissions ?? []
  if (!permissions.some((p) => userPerms.includes(p))) {
    throw new Error("Forbidden")
  }
}

/**
 * Throws if the current session does not have ALL of the given permissions.
 */
export async function requireAllPermissions(permissions: (PermissionCode | string)[]): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Forbidden")
  }
  if (session.user.role === "SUPER_ADMIN") return;
  const userPerms = session.user.permissions ?? []
  if (!permissions.every((p) => userPerms.includes(p))) {
    throw new Error("Forbidden")
  }
}

/**
 * Throws if the current session's role does not match the required role.
 */
export async function requireRole(role: string): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error("Forbidden")
  }
  if (session.user.role !== role) {
    throw new Error("Forbidden")
  }
}
