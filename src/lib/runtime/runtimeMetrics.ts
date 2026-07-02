/**
 * Runtime Metrics
 *
 * Provides historical tracking of runtime metrics with a rolling window.
 * Foundation for future Event Loop Delay measurement and dashboard charts.
 */

import type { RuntimeSnapshot } from "@/lib/health/healthTypes"
import { getRuntimeSnapshot } from "./runtimeSnapshot"

interface MetricSample {
  snapshot: RuntimeSnapshot
  timestamp: number
}

const MAX_SAMPLES = 60 // Keep last 60 samples (e.g. 1 per minute = 1 hour)
const samples: MetricSample[] = []

/**
 * Records a new runtime sample.
 * Call this periodically (e.g. via a cron/interval) to build history.
 */
export function recordSample(): MetricSample {
  const sample: MetricSample = {
    snapshot: getRuntimeSnapshot(),
    timestamp: Date.now(),
  }
  samples.push(sample)
  if (samples.length > MAX_SAMPLES) {
    samples.shift()
  }
  return sample
}

/**
 * Returns the full sample history (oldest first).
 */
export function getSampleHistory(): readonly MetricSample[] {
  return samples
}

/**
 * Returns the most recent sample, or records a new one if empty.
 */
export function getLatestSample(): MetricSample {
  if (samples.length === 0) return recordSample()
  return samples[samples.length - 1]
}

/**
 * Returns the number of stored samples.
 */
export function getSampleCount(): number {
  return samples.length
}

/**
 * Clears all stored samples (useful in tests).
 */
export function clearSamples(): void {
  samples.length = 0
}
