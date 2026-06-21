"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function getEntityAuditLogs(entityType: string, entityId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return { success: true, logs }
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs."
    return { error: message }
  }
}

export async function getAuditLogs(params: {
  page?: number
  limit?: number
  action?: string
  performedBy?: string
  entityType?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("audit.view")) {
      return { error: "Unauthorized" }
    }

    const page = params.page || 1
    const limit = params.limit || 25
    const skip = (page - 1) * limit

    const where: Prisma.AuditLogWhereInput = {}

    if (params.action) where.action = params.action
    if (params.entityType) where.entityType = params.entityType
    if (params.performedBy) {
      where.performedBy = { contains: params.performedBy, mode: "insensitive" }
    }
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {}
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom)
      if (params.dateTo) {
        const to = new Date(params.dateTo)
        to.setHours(23, 59, 59, 999)
        where.createdAt.lte = to
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where })
    ])

    // If search is given, do in-memory filter on newValue/oldValue JSON string
    let filtered = logs
    if (params.search) {
      const s = params.search.toLowerCase()
      filtered = logs.filter(l =>
        (l.newValue ? JSON.stringify(l.newValue).toLowerCase().includes(s) : false) ||
        (l.oldValue ? JSON.stringify(l.oldValue).toLowerCase().includes(s) : false) ||
        (l.entityId?.toLowerCase().includes(s)) ||
        (l.performedBy?.toLowerCase().includes(s))
      )
    }

    return {
      success: true,
      logs: filtered,
      total,
      totalPages: Math.ceil(total / limit),
      page
    }
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs."
    return { error: message }
  }
}

export async function getAuditLogActions() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("audit.view")) {
      return { error: "Unauthorized" }
    }

    const results = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" }
    })
    return { success: true, actions: results.map(r => r.action) }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch actions."
    return { error: message }
  }
}
