/**
 * Session Invalidation Store
 * 
 * In-memory store to track users whose sessions must be invalidated
 * (e.g., due to password change or role update).
 * 
 * Implementasi saat ini menggunakan Memory Store dan siap diganti Redis
 * tanpa perubahan pada Business Layer di Production V2.
 */
class MemorySessionInvalidationStore {
  private invalidations = new Map<string, number>()
  private globalInvalidatedAt = 0

  constructor() {
    // Jalankan cleanup otomatis setiap 1 jam untuk mencegah memory leak
    setInterval(() => {
      this.clearExpired().catch(console.error)
    }, 60 * 60 * 1000)
  }

  /**
   * Invalidates a specific user's session.
   * Any JWT issued before this timestamp will be rejected.
   */
  async invalidateUser(userId: string): Promise<void> {
    this.invalidations.set(userId, Date.now())
  }

  /**
   * Invalidates all users.
   */
  async invalidateAll(): Promise<void> {
    this.globalInvalidatedAt = Date.now()
  }

  /**
   * Gets the timestamp when the user was last invalidated.
   * Returns undefined if never invalidated in this store's lifetime.
   */
  async getInvalidatedAt(userId: string): Promise<number | undefined> {
    const userInvalidatedAt = this.invalidations.get(userId) ?? 0
    const finalInvalidatedAt = Math.max(userInvalidatedAt, this.globalInvalidatedAt)
    return finalInvalidatedAt === 0 ? undefined : finalInvalidatedAt
  }

  /**
   * Clears expired invalidation records to free memory.
   * In a real Redis store, keys would have a TTL.
   */
  async clearExpired(maxAgeMs: number = 8 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAgeMs
    for (const [userId, time] of Array.from(this.invalidations.entries())) {
      if (time < cutoff) {
        this.invalidations.delete(userId)
      }
    }
  }
}

export const sessionInvalidationStore = new MemorySessionInvalidationStore()
