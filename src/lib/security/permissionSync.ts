/**
 * Permission Sync Module
 *
 * Handles JWT permission refresh logic, extracted from the NextAuth jwt()
 * callback for testability. This module is the single source of truth for
 * when and how permissions are refreshed during an active session.
 */

import type { PrismaClient } from "@prisma/client"

/** Permission refresh interval — single source of truth, reused in session config */
export const PERMISSION_REFRESH_INTERVAL_MS = 60 * 30 * 1000 // 30 minutes

/**
 * Determine whether permissions need to be refreshed based on the
 * explicit permissionRefreshedAt timestamp.
 */
export function needsPermissionRefresh(permissionRefreshedAt: number | undefined): boolean {
  if (permissionRefreshedAt === undefined || permissionRefreshedAt === null) {
    return true
  }
  return (Date.now() - permissionRefreshedAt) >= PERMISSION_REFRESH_INTERVAL_MS
}

/**
 * Refresh user authorization data from the database.
 *
 * - If user is found: returns updated { role, permissions, satkerId, permissionRefreshedAt }
 * - If user is deleted: returns cleared auth data (role="", permissions=[], satkerId=null)
 * - If DB fails: returns null (caller should keep existing token data — fail-open)
 */
export async function refreshUserPermissions(
  prisma: PrismaClient,
  userId: string,
) {
  try {
    const freshUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        satkerId: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: {
                  select: { code: true }
                }
              }
            }
          }
        }
      }
    })

    if (!freshUser) {
      // User no longer exists — clear all authorization data.
      // The session cookie remains but the user has zero permissions,
      // effectively locking them out of all protected resources.
      return {
        role: "",
        permissions: [] as string[],
        satkerId: null,
        permissionRefreshedAt: Date.now(),
      }
    }

    // Extract permission codes from the nested select result
    const permissionCodes = freshUser.role?.permissions.map(
      (rp) => rp.permission.code
    ) ?? []

    return {
      role: freshUser.role?.name ?? "GUEST",
      permissions: permissionCodes,
      satkerId: freshUser.satkerId,
      permissionRefreshedAt: Date.now(),
    }
  } catch {
    // Fail-open: return null so caller keeps existing token data.
    // Do NOT clear permissions on transient DB errors.
    return null
  }
}
