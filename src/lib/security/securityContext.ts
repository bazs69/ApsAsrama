/**
 * Security Context Builder
 * 
 * Builds a standardized SecurityContext from the current session.
 * This context is passed to every executor inside secureAction().
 */

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateRequestId } from "@/lib/request/requestId"
import { SECURITY_CONSTANTS } from "./securityConstants"
import { type SecurityContext } from "./securityTypes"

/**
 * Builds and returns a SecurityContext for the current request.
 * Returns null if there is no valid session.
 */
export async function buildSecurityContext(requestId?: string): Promise<SecurityContext | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return {
    currentUserId: session.user.id,
    sessionId: (session as { sessionId?: string }).sessionId ?? session.user.id,
    roleId: (session.user as { roleId?: string }).roleId ?? "",
    roleName: session.user.role ?? "",
    permissions: session.user.permissions ?? [],
    requestId: requestId ?? generateRequestId(),
    timestamp: Date.now(),
    version: SECURITY_CONSTANTS.VERSION,
  }
}
