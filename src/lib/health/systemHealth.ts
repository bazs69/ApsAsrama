/**
 * System Health Utilities
 * 
 * Abstraction layer for operational health checks.
 * In Production V2, isCacheHealthy() and isQueueHealthy() will check Redis/BullMQ.
 */
import prisma from "@/lib/prisma"

export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

export async function isCacheHealthy(): Promise<boolean> {
  // Placeholder for Production V2 (Redis check)
  return true
}

export async function isQueueHealthy(): Promise<boolean> {
  // Placeholder for Production V2 (BullMQ/RabbitMQ check)
  return true
}

export async function getSystemHealth() {
  const [database, cache, queue] = await Promise.all([
    isDatabaseHealthy(),
    isCacheHealthy(),
    isQueueHealthy()
  ])

  return {
    database,
    cache,
    queue,
    timestamp: Date.now()
  }
}
