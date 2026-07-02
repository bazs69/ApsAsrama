/**
 * Secure Action Wrapper
 * 
 * The main Enterprise wrapper for all Server Actions.
 * Handles authentication, authorization, error mapping, and monitoring transparently.
 */

import { buildSecurityContext } from "./securityContext"
import { auditTrail } from "@/lib/audit/auditTrail"
import { AUDIT_EVENT_STATUS, AUDIT_EVENT_SEVERITY } from "@/lib/audit/auditConstants"
import { guardPermission, guardAnyPermission, guardAllPermissions } from "./permissionGuard"
import { secureSuccess, secureFailure } from "./securityResult"
import { classifyError } from "./securityErrors"
import { type SecureActionConfig, type SecureResult } from "./securityTypes"
import { SECURITY_CONSTANTS } from "./securityConstants"
import { monitorAdapter } from "@/lib/monitoring/monitorAdapter"
import { MONITORING_CONSTANTS } from "@/lib/monitoring/constants"

/**
 * Wraps a Next.js Server Action with standard enterprise security layers.
 */
export async function secureAction<T>(config: SecureActionConfig<T>): Promise<SecureResult<T>> {
  let context = null

  try {
    // 1. Authentication Check
    context = await buildSecurityContext()
    if (!context) {
      monitorAdapter.trackSecurity({
        category: MONITORING_CONSTANTS.CATEGORY.SECURITY,
        event: "UNAUTHORIZED",
        severity: MONITORING_CONSTANTS.SEVERITY.CRITICAL,
        module: config.module,
        action: config.action,
        errorCode: SECURITY_CONSTANTS.ERROR_CODES.AUTH_001,
      })
      // Use a generated request ID for unauthenticated requests since context isn't built
      return secureFailure(
        SECURITY_CONSTANTS.ERROR_CODES.AUTH_001,
        "REQ-UNAUTH-" + Date.now()
      )
    }

    // 2. Authorization (Permission) Check
    if (config.permission) {
      const perms = Array.isArray(config.permission) ? config.permission : [config.permission]
      if (perms.length === 1) {
        guardPermission(context, perms[0])
      } else {
        guardAnyPermission(context, perms)
      }
    }

    if (config.allPermissions && config.allPermissions.length > 0) {
      guardAllPermissions(context, config.allPermissions)
    }

    // 3. (Audit preparation) - Context is fully populated and authorized, 
    // it will be passed to executor which can use it to log audits in Tahap 4F.2.

    // 4. Execution
    const result = await config.executor(context)

    // 4.5. Audit Logging (Success)
    // Best-effort auto-extraction of entityId from result
    let entityId: string | undefined = undefined;
    if (result && typeof result === "object") {
      if ("id" in result) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entityId = String((result as any).id);
      } else {
        for (const val of Object.values(result)) {
          if (val && typeof val === "object" && "id" in val) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            entityId = String((val as any).id);
            break;
          }
        }
      }
    }

    // Fire and forget audit
    auditTrail.track({
      action: config.action,
      module: config.module,
      entity: config.module,
      entityId,
      actorId: context.currentUserId,
      status: AUDIT_EVENT_STATUS.SUCCESS,
      severity: AUDIT_EVENT_SEVERITY.INFO,
      metadata: {
        requestId: context.requestId,
        ipAddress: undefined,
        userAgent: undefined,
      },
      timestamp: Date.now()
    }).catch(() => {});

    // 5. Success Return
    return secureSuccess(result, context.requestId)
  } catch (error) {
    // Determine exact error classification
    const errorCode = classifyError(error)
    const isSecurityError = errorCode.startsWith("AUTH")

    if (isSecurityError) {
      let eventType: "UNAUTHORIZED" | "FORBIDDEN" | "PERMISSION_DENIED" | "SESSION_EXPIRED" | "RATE_LIMITED" = "FORBIDDEN"
      if (errorCode === SECURITY_CONSTANTS.ERROR_CODES.AUTH_001) eventType = "UNAUTHORIZED"
      if (errorCode === SECURITY_CONSTANTS.ERROR_CODES.AUTH_002) eventType = "SESSION_EXPIRED"
      if (errorCode.startsWith("AUTHZ")) eventType = "PERMISSION_DENIED"

      monitorAdapter.trackSecurity({
        category: MONITORING_CONSTANTS.CATEGORY.SECURITY,
        event: eventType,
        severity: MONITORING_CONSTANTS.SEVERITY.ERROR,
        module: config.module,
        action: config.action,
        userId: context?.currentUserId,
        errorCode,
        requestId: context?.requestId,
      })
    }

    const message = error instanceof Error ? error.message : undefined

    // Fire and forget audit for failures
    auditTrail.track({
      action: config.action,
      module: config.module,
      entity: config.module,
      actorId: context?.currentUserId ?? null,
      status: AUDIT_EVENT_STATUS.FAILURE,
      severity: isSecurityError ? AUDIT_EVENT_SEVERITY.CRITICAL : AUDIT_EVENT_SEVERITY.WARNING,
      metadata: {
        requestId: context?.requestId ?? "REQ-ERR-" + Date.now(),
        ipAddress: undefined,
        userAgent: undefined,
        errorCode,
        description: message,
      },
      timestamp: Date.now()
    }).catch(() => {});

    return secureFailure(
      errorCode,
      context?.requestId ?? "REQ-ERR-" + Date.now(),
      message && !isSecurityError ? message : undefined // Keep internal auth messages masked by secureFailure defaults
    )
  }
}
