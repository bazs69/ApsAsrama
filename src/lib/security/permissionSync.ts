/**
 * Permission Sync Module
 *
 * Handles JWT permission refresh logic, extracted from the NextAuth jwt()
 * callback for testability. This module is the single source of truth for
 * when and how permissions are refreshed during an active session.
 */

import type { PrismaClient } from "@prisma/client"

/** Refresh interval — must match session.updateAge in auth.ts */
const REFRESH_INTERVAL_MS = 60 * 30 * 1000 // 30 minutes

/**
 * Determine whether permissions need to be refreshed based on the
 * explicit lastPermissionSync timestamp.
 */
export function needsPermissionRefresh(lastPermissionSync: number | undefined): boolean {
  if (lastPermissionSync === undefined || lastPermissionSync === null) {
    return true
  }
  return (Date.now() - lastPermissionSync) >= REFRESH_INTERVAL_MS
}

/**
 * Refresh user authorization data from the database.
 *
 * - If user is found: returns updated { role, permissions, satkerId, lastPermissionSync }
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
        lastPermissionSync: Date.now(),
      }
    }

    return {
      role: freshUser.role?.name || "GUEST",
      permissions: freshUser.role?.permissions.map(
        (rp: { permission: { code: string } }) => rp.permission.code
      ) || [],
      satkerId: freshUser.satkerId,
      lastPermissionSync: Date.now(),
    }
  } catch {
    // Fail-open: return null so caller keeps existing token data.
    // Do NOT clear permissions on transient DB errors.
    return null
  }
}
