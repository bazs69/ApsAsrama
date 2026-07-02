/**
 * Runtime Snapshot
 *
 * Captures a point-in-time snapshot of Node.js process metrics.
 * All data is read-only and non-destructive.
 */

import type { RuntimeSnapshot } from "@/lib/health/healthTypes"

/**
 * Returns a frozen snapshot of current process metrics.
 */
export function getRuntimeSnapshot(): RuntimeSnapshot {
  const mem = process.memoryUsage()
  const cpu = process.cpuUsage()

  return {
    processUptime: Math.floor(process.uptime()),
    heapUsedMB: round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: round(mem.heapTotal / 1024 / 1024),
    rssMB: round(mem.rss / 1024 / 1024),
    externalMB: round(mem.external / 1024 / 1024),
    cpuUser: cpu.user,
    cpuSystem: cpu.system,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
