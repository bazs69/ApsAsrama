export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitRecord {
  count: number;
  resetTime: number; // timestamp in ms when the window expires
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitRecord>;
  get(key: string): Promise<RateLimitRecord | null>;
  reset(key: string): Promise<void>;
}
