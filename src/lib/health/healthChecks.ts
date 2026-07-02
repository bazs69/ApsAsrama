/**
 * Health Checks
 *
 * Individual, modular health check functions.
 * Each check returns a HealthCheckResult and is independently testable.
 * All checks are fail-safe — they report UNHEALTHY rather than throwing.
 */

import prisma from "@/lib/prisma"
import type { HealthCheckResult, HealthStatus } from "./healthTypes"
import { HEALTH_CONSTANTS } from "./healthConstants"

// ─── Helper ───────────────────────────────────────────────────────────────────

function result(
  name: string,
  status: HealthStatus,
  message: string,
  startMs: number,
  metadata?: Record<string, unknown>,
): HealthCheckResult {
  return { name, status, message, durationMs: Date.now() - startMs, timestamp: Date.now(), metadata }
}

// ─── Checks ───────────────────────────────────────────────────────────────────

/** Verifies Prisma can reach the database with a trivial query. */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  const name = HEALTH_CONSTANTS.CHECK_NAMES.DATABASE
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB health check timeout")), HEALTH_CONSTANTS.THRESHOLDS.DB_TIMEOUT_MS),
    )
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeoutPromise,
    ])
    return result(name, "HEALTHY", "Database connection OK", start)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown database error"
    return result(name, "UNHEALTHY", msg, start)
  }
}

/** Checks Prisma client instantiation is valid. */
export async function checkPrismaConnection(): Promise<HealthCheckResult> {
  const start = Date.now()
  const name = HEALTH_CONSTANTS.CHECK_NAMES.PRISMA
  try {
    // $connect is idempotent — safe to call repeatedly
    await prisma.$connect()
    return result(name, "HEALTHY", "Prisma client connected", start)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Prisma connection failed"
    return result(name, "UNHEALTHY", msg, start)
  }
}

/** Evaluates current heap memory usage against thresholds. */
export function checkMemory(): HealthCheckResult {
  const start = Date.now()
  const name = HEALTH_CONSTANTS.CHECK_NAMES.MEMORY
  try {
    const mem = process.memoryUsage()
    const usedPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100)
    const metadata = {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      usedPercent,
    }

    if (usedPercent >= HEALTH_CONSTANTS.THRESHOLDS.MEMORY_CRITICAL_PERCENT) {
      return result(name, "UNHEALTHY", `Heap at ${usedPercent}% — critical`, start, metadata)
    }
    if (usedPercent >= HEALTH_CONSTANTS.THRESHOLDS.MEMORY_WARN_PERCENT) {
      return result(name, "DEGRADED", `Heap at ${usedPercent}% — elevated`, start, metadata)
    }
    return result(name, "HEALTHY", `Heap at ${usedPercent}%`, start, metadata)
  } catch {
    return result(name, "UNHEALTHY", "Unable to read memory usage", start)
  }
}

/** Reports process uptime. Always HEALTHY — purely informational. */
export function checkUptime(): HealthCheckResult {
  const start = Date.now()
  const uptimeSec = Math.floor(process.uptime())
  return result(HEALTH_CONSTANTS.CHECK_NAMES.UPTIME, "HEALTHY", `Uptime: ${uptimeSec}s`, start, { uptimeSec })
}

/** Validates Node.js version meets minimum. */
export function checkNodeVersion(): HealthCheckResult {
  const start = Date.now()
  const name = HEALTH_CONSTANTS.CHECK_NAMES.NODE_VERSION
  const major = parseInt(process.versions.node.split(".")[0], 10)
  if (major < HEALTH_CONSTANTS.THRESHOLDS.MIN_NODE_MAJOR) {
    return result(name, "DEGRADED", `Node ${process.versions.node} — below minimum v${HEALTH_CONSTANTS.THRESHOLDS.MIN_NODE_MAJOR}`, start, { major })
  }
  return result(name, "HEALTHY", `Node ${process.versions.node}`, start, { major })
}

/** Validates critical environment variables are set. */
export function checkEnvironment(): HealthCheckResult {
  const start = Date.now()
  const name = HEALTH_CONSTANTS.CHECK_NAMES.ENVIRONMENT
  const missing: string[] = []
  for (const envVar of HEALTH_CONSTANTS.REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) missing.push(envVar)
  }

  if (missing.length > 0) {
    return result(name, "DEGRADED", `Missing env vars: ${missing.join(", ")}`, start, { missing })
  }
  return result(name, "HEALTHY", "All required environment variables set", start, {
    env: process.env.NODE_ENV ?? "development",
  })
}

/** Request Layer status — always healthy as it's a static module. */
export function checkRequestLayer(): HealthCheckResult {
  const start = Date.now()
  return result(HEALTH_CONSTANTS.CHECK_NAMES.REQUEST_LAYER, "HEALTHY", "Request Layer active", start)
}

/** Monitoring status — always healthy as it's a static module. */
export function checkMonitoring(): HealthCheckResult {
  const start = Date.now()
  return result(HEALTH_CONSTANTS.CHECK_NAMES.MONITORING, "HEALTHY", "Monitoring Layer active", start)
}
