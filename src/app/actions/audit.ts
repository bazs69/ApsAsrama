"use server"

import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { PERMISSIONS } from "@/lib/security/permissions"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"

export async function getEntityAuditLogs(entityType: string, entityId: string) {
  return secureAction({
    module: "Audit",
    action: "getEntityAuditLogs",
    permission: PERMISSIONS.AUDIT_VIEW,
    executor: async (context) => {
      const logs = await prisma.auditLog.findMany({
        where: {
          entityType,
          entityId
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return { logs }
    }
  })
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
  return secureAction({
    module: "Audit",
    action: "getAuditLogs",
    permission: PERMISSIONS.AUDIT_VIEW,
    executor: async (context) => {
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
        logs: filtered,
        total,
        totalPages: Math.ceil(total / limit),
        page
      }
    }
  })
}

export async function getAuditLogsPaginated(options: { page: number; pageSize: number; search?: string }) {
  return secureAction({
    module: "Audit",
    action: "getAuditLogsPaginated",
    permission: PERMISSIONS.AUDIT_VIEW,
    executor: async (context) => {
      const { page, pageSize, search } = options
      const skip = (page - 1) * pageSize
      const take = pageSize

      const where: Prisma.AuditLogWhereInput = {}
      if (search) {
        where.OR = [
          { performedBy: { contains: search, mode: "insensitive" } },
          { entityId: { contains: search, mode: "insensitive" } },
          { entityType: { contains: search, mode: "insensitive" } },
          { action: { contains: search, mode: "insensitive" } },
        ]
      }

      const [total, data] = await prisma.$transaction([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            performedBy: true,
            createdAt: true,
            // intentionally omit newValue and oldValue to reduce payload
          }
        })
      ])

      const totalPages = Math.ceil(total / pageSize)

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    }
  })
}

export async function getAuditLogActions() {
  return secureAction({
    module: "Audit",
    action: "getAuditLogActions",
    permission: PERMISSIONS.AUDIT_VIEW,
    executor: async (context) => {
      const results = await prisma.auditLog.findMany({
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" }
      })
      return { actions: results.map(r => r.action) }
    }
  })
}

export async function getAuditLogsCursor(
  options: {
    cursor?: string
    take?: number
    search?: string
    action?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  return secureAction({
    module: "Audit",
    action: "getAuditLogsCursor",
    permission: PERMISSIONS.AUDIT_VIEW,
    executor: async () => {
      const {
        cursor,
        take = 20,
        search,
        action,
        startDate,
        endDate
      } = options

      const where: Prisma.AuditLogWhereInput = {}

      if (search) {
        where.OR = [
          { performedBy: { contains: search, mode: "insensitive" } },
          { entityType: { contains: search, mode: "insensitive" } }
        ]
      }

      if (action) {
        where.action = action
      }

      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate)
      }

      const data = await prisma.auditLog.findMany({
        where,
        take: take + 1, // take 1 extra to check for next page
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          performedBy: true,
          createdAt: true,
        }
      })

      let nextCursor: string | undefined = undefined
      if (data.length > take) {
        const nextItem = data.pop()
        nextCursor = nextItem?.id
      }

      return {
        data,
        pagination: {
          take,
          nextCursor,
          hasNextPage: !!nextCursor,
        }
      }
    }
  })
}
