/**
 * Permission Guard
 * 
 * Reusable, domain-agnostic permission guards for use inside secureAction().
 * These are PURE FUNCTIONS — they accept a context and throw SecurityError if guard fails.
 * 
 * They do NOT fetch sessions themselves; session is already resolved in secureAction().
 */

import { SECURITY_CONSTANTS } from "./securityConstants"
import { type SecurityContext } from "./securityTypes"

// SUPER_ADMIN bypasses all permission checks
const isSuperAdmin = (ctx: SecurityContext) => ctx.roleName === "SUPER_ADMIN"

/**
 * Require exactly one specific permission.
 * Throws SecurityError code AUTHZ_001 if check fails.
 */
export function guardPermission(ctx: SecurityContext, permission: string): void {
  if (isSuperAdmin(ctx)) return
  if (!ctx.permissions.includes(permission)) {
    throw Object.assign(new Error("Forbidden"), { code: SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_001 })
  }
}

/**
 * Require AT LEAST ONE of the given permissions.
 * Throws SecurityError code AUTHZ_002 if check fails.
 */
export function guardAnyPermission(ctx: SecurityContext, permissions: string[]): void {
  if (isSuperAdmin(ctx)) return
  if (!permissions.some((p) => ctx.permissions.includes(p))) {
    throw Object.assign(new Error("Forbidden"), { code: SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_002 })
  }
}

/**
 * Require ALL of the given permissions.
 * Throws SecurityError code AUTHZ_003 if check fails.
 */
export function guardAllPermissions(ctx: SecurityContext, permissions: string[]): void {
  if (isSuperAdmin(ctx)) return
  if (!permissions.every((p) => ctx.permissions.includes(p))) {
    throw Object.assign(new Error("Forbidden"), { code: SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_003 })
  }
}
