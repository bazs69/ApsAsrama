import type { AuditEvent } from "../auditTypes"

export interface AuditAdapter {
  /**
   * Saves the structured audit event to a persistent storage.
   */
  save(event: AuditEvent): Promise<void>
}
