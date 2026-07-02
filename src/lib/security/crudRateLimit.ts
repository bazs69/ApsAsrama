import { rateLimiterAdapter } from "./rateLimiterAdapter"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { logAuditEvent } from "@/lib/security/auditLogger"
import { AuditAction } from "@/lib/security/auditActions"

/**
 * Checks the CRUD rate limit for the currently authenticated user.
 * Returns the user ID if the request is allowed.
 * Returns null if no session or the limit is exceeded.
 *
 * Usage pattern:
 *   const userId = await checkCrudRateLimit()
 *   if (!userId) return { error: "Too many requests." }
 */
export async function checkCrudRateLimit(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const result = await rateLimiterAdapter.consume(session.user.id)
  if (!result.success) {
    try {
      await logAuditEvent({
        action: AuditAction.CRUD_RATE_LIMIT,
        actorId: session.user.id,
        resource: "crud",
        metadata: {
          remaining: result.remaining,
          resetTime: result.resetTime
        }
      })
    } catch {
      // fail-open
    }
    return null
  }

  return session.user.id
}
