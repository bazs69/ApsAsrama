/**
 * Performance Timer
 * 
 * Utility for measuring operation durations.
 * Designed to be composable — use start/stop for sync code or measureAsync for async.
 */

export interface PerformanceHandle {
  startedAt: number
  stop: () => number // Returns duration in ms
}

export function startTimer(): PerformanceHandle {
  const startedAt = Date.now()
  return {
    startedAt,
    stop: () => Date.now() - startedAt,
  }
}

/**
 * Wraps an async operation and returns both the result and the duration in ms.
 */
export async function measureAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const timer = startTimer()
  const result = await fn()
  return { result, durationMs: timer.stop() }
}
