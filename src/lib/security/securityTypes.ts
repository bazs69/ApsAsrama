/**
 * Security Types
 * 
 * All TypeScript interfaces and types for the Security Layer.
 * Kept separate to allow other modules to import types without importing logic.
 */

import { type SecurityErrorCode } from "./securityConstants"

// The security context built at the start of every secure action call
export interface SecurityContext {
  currentUserId: string
  sessionId: string
  roleId: string
  roleName: string
  permissions: string[]
  requestId: string        // Correlated with the Request Layer (Tahap 4D.2)
  timestamp: number
  version: string
}

// Structured security error with semantic code
export interface SecurityError {
  code: SecurityErrorCode
  title: string
  description: string
  retryable: boolean
}

// Prepared audit context (written to DB in Tahap 4F.2)
export interface AuditContext {
  actorId: string
  actorRole: string
  action: string
  resource: string
  resourceId?: string
  requestId: string
  timestamp: number
  outcome: "SUCCESS" | "FAILURE"
  errorCode?: SecurityErrorCode
  metadata?: Record<string, unknown>
}

// Standardized result for ALL server actions using secureAction()
// We use an intersection type (T & {...}) so that any custom properties returned by
// the executor (like { userId: string } or { satker: object }) remain at the root level,
// guaranteeing zero regression for frontend components that expect those properties directly.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type SecureResult<T = {}> = (T extends undefined | void ? {} : T) & {
  success: boolean
  error?: string
  errorCode?: SecurityErrorCode
  requestId: string
  timestamp: number
}

// Config passed to secureAction()
export interface SecureActionConfig<T> {
  permission?: string | string[]   // One or more permissions to check (any-match)
  allPermissions?: string[]        // All of these permissions must be present
  module: string
  action: string
  executor: (context: SecurityContext) => Promise<T>
  auditResource?: string           // e.g., "user", "santri"
  auditResourceId?: string
  auditMetadata?: Record<string, unknown>
}
