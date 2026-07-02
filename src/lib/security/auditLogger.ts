/**
 * Audit Logger Service
 *
 * Centralized service for recording security audit events.
 * Writes to the SecurityEvent table via Prisma.
 *
 * This module is infrastructure only — it does not contain
 * business logic, permission checks, or authentication.
 */

import prisma from "../prisma"
import type { AuditAction } from "./auditActions"
import type { Prisma } from "@prisma/client"

export interface AuditEventInput {
  /** Action performed (use AuditAction constants) */
  action: AuditAction
  /** Resource type affected (e.g. "user", "role", "session") */
  resource: string
  /** ID of the actor performing the action (nullable for unauthenticated events) */
  actorId?: string | null
  /** ID of the affected resource (nullable) */
  resourceId?: string | null
  /** Client IP address (nullable) */
  ipAddress?: string | null
  /** Client user agent string (nullable) */
  userAgent?: string | null
  /** Arbitrary JSON metadata for extensibility (nullable) */
  metadata?: Record<string, unknown> | null
}

/**
 * Record a single security audit event.
 *
 * Fail-open: if the insert fails, the error is silently ignored
 * so that audit logging never blocks core application flow.
 */
export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        action: event.action,
        resource: event.resource,
        actorId: event.actorId ?? null,
        resourceId: event.resourceId ?? null,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
        metadata: (event.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  } catch {
    // Fail-open: audit logging must never break the caller's flow.
  }
}
