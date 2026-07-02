/**
 * Audit Trail Types
 * 
 * Defines the core interfaces for the Enterprise Audit Trail system.
 */

import type { AuditEventAction, AuditEventStatus, AuditEventSeverity } from "./auditConstants"

export interface AuditMetadata {
  requestId: string
  ipAddress?: string
  userAgent?: string
  description?: string
  oldValue?: unknown
  newValue?: unknown
  errorCode?: string
  [key: string]: unknown
}

export interface AuditEvent {
  action: AuditEventAction | string
  module: string
  entity?: string
  entityId?: string
  actorId?: string | null
  status: AuditEventStatus
  severity: AuditEventSeverity
  metadata: AuditMetadata
  timestamp: number
}
