import type { AuditAdapter } from "./AuditAdapter"
import type { AuditEvent } from "../auditTypes"
import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { AuditFormatter } from "../auditFormatter"

export class DatabaseAdapter implements AuditAdapter {
  async save(event: AuditEvent): Promise<void> {
    try {
      // Enrich the metadata with a human-readable format if not already provided
      if (!event.metadata.description) {
        event.metadata.description = AuditFormatter.format(event)
      }

      // Map the generic AuditEvent into the existing SecurityEvent Prisma schema
      // This ensures we do not break existing database schemas.
      await prisma.securityEvent.create({
        data: {
          action: event.action,
          resource: event.entity || event.module,
          actorId: event.actorId ?? null,
          resourceId: event.entityId ?? null,
          ipAddress: event.metadata.ipAddress ?? null,
          userAgent: event.metadata.userAgent ?? null,
          metadata: {
            ...event.metadata,
            status: event.status,
            severity: event.severity,
          } as Prisma.InputJsonValue,
        },
      })
    } catch (error) {
      // Fail-open: if audit logging fails, log to console but do not crash the app
      console.error("[AuditLayer] DatabaseAdapter failed to save event:", error)
    }
  }
}
