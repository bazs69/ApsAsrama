import type { AuditEvent } from "./auditTypes"
import type { AuditAdapter } from "./auditAdapters/AuditAdapter"
import { DatabaseAdapter } from "./auditAdapters/DatabaseAdapter"

class AuditTrail {
  private adapters: AuditAdapter[] = []

  constructor() {
    // Register the default database adapter
    this.registerAdapter(new DatabaseAdapter())
  }

  /**
   * Registers a new audit adapter (useful for testing or future external integrations)
   */
  public registerAdapter(adapter: AuditAdapter) {
    this.adapters.push(adapter)
  }

  /**
   * Tracks a new audit event across all registered adapters
   */
  public async track(event: AuditEvent): Promise<void> {
    // Fill timestamp if not present
    if (!event.timestamp) {
      event.timestamp = Date.now()
    }

    // Broadcast to all adapters
    const promises = this.adapters.map(adapter => adapter.save(event))
    
    // Fire and forget (fail-open)
    Promise.allSettled(promises).catch(err => {
      console.error("[AuditLayer] Unexpected error broadcasting audit event:", err)
    })
  }
}

// Singleton instance
export const auditTrail = new AuditTrail()
