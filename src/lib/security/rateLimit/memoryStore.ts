import type { RateLimitStore, RateLimitRecord } from './types';

export class MemoryStore implements RateLimitStore {
  private store: Map<string, RateLimitRecord>;

  constructor() {
    this.store = new Map<string, RateLimitRecord>();
  }

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime <= now) {
      // Create new record or overwrite expired one
      const newRecord: RateLimitRecord = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.store.set(key, newRecord);
      return newRecord;
    }

    // Increment existing record
    record.count += 1;
    this.store.set(key, record);
    return record;
  }

  async get(key: string): Promise<RateLimitRecord | null> {
    const now = Date.now();
    const record = this.store.get(key);

    if (record && record.resetTime <= now) {
      // Clean up expired record lazily
      this.store.delete(key);
      return null;
    }

    return record || null;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Utility to clear the entire store (e.g. for testing)
  clear(): void {
    this.store.clear();
  }
}
