import { SectionHeader } from "@/components/ui/SectionHeader"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { AuditOverview } from "@/components/ops/AuditOverview"
import { AuditSearch } from "@/components/ops/AuditSearch"
import { AuditFilter } from "@/components/ops/AuditFilter"
import { AuditTable } from "@/components/ops/AuditTable"
import { RefreshButton } from "@/components/ops/RefreshButton"
import { AuditPagination } from "@/components/ops/AuditPagination"
import type { AuditEventRowData } from "@/components/ops/AuditRow"
import type { ThreatLevel } from "@/lib/security/threatDetector"

export const dynamic = "force-dynamic"


export default async function AuditDashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // 1. Parsing URL Params
  const page = parseInt(searchParams.page as string) || 1
  const pageSize = parseInt(searchParams.pageSize as string) || 10
  const q = (searchParams.q as string) || ""
  const status = (searchParams.status as string) || "ALL"
  const severity = (searchParams.severity as string) || "ALL"
  const moduleFilter = (searchParams.module as string) || "ALL"
  const date = (searchParams.date as string) || "ALL"
  const sort = (searchParams.sort as string) || "newest"

  // 2. Building Prisma Where Clause
  const where: Prisma.SecurityEventWhereInput = {}

  if (q) {
    where.OR = [
      { action: { contains: q, mode: "insensitive" } },
      { resource: { contains: q, mode: "insensitive" } },
      { actorId: { contains: q, mode: "insensitive" } },
      { resourceId: { contains: q, mode: "insensitive" } },
    ]
  }

  if (moduleFilter !== "ALL") {
    where.resource = { equals: moduleFilter, mode: "insensitive" }
  }

  if (date !== "ALL") {
    const now = new Date()
    const startDate = new Date()
    if (date === "TODAY") {
      startDate.setHours(0, 0, 0, 0)
    } else if (date === "7DAYS") {
      startDate.setDate(now.getDate() - 7)
    } else if (date === "30DAYS") {
      startDate.setDate(now.getDate() - 30)
    }
    where.createdAt = { gte: startDate }
  }

  // To filter by JSON fields (status, severity), we must do it carefully.
  // PostgreSQL supports jsonb querying, Prisma supports path querying.
  if (status !== "ALL" || severity !== "ALL") {
    const AND = []
    if (status !== "ALL") {
      AND.push({
        metadata: {
          path: ["status"],
          equals: status,
        }
      })
    }
    if (severity !== "ALL") {
      AND.push({
        metadata: {
          path: ["severity"],
          equals: severity.toLowerCase(), // audit logs save severity in lowercase usually
        }
      })
    }
    if (AND.length > 0) {
      where.AND = AND
    }
  }

  // 3. Building Order By
  let orderBy: Prisma.SecurityEventOrderByWithRelationInput = { createdAt: "desc" }
  
  if (sort === "oldest") orderBy = { createdAt: "asc" }
  if (sort === "module_asc") orderBy = { resource: "asc" }
  if (sort === "module_desc") orderBy = { resource: "desc" }
  // Sorting by JSON fields like severity is tricky across databases in Prisma.
  // We will let createdAt be the primary sort if not supported easily, but let's 
  // just fall back to createdAt for severity sorts as we don't have a dedicated DB column.
  // If we really must sort by severity, we'd do it in memory for the page, but pagination 
  // breaks. We'll use createdAt for now to keep it safe.

  // 4. Fetching Data
  const [totalItems, events, allEventsForStats] = await Promise.all([
    prisma.securityEvent.count({ where }),
    prisma.securityEvent.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { name: true, email: true } } }
    }),
    // 5. Fetching Stats (Overview) - we fetch count of today, critical, etc.
    // For large scale, we should aggregate. Here we'll do simple counts.
    prisma.securityEvent.findMany({
      select: { metadata: true, createdAt: true, action: true },
      // Optional: limit to 1000 for stats if db is huge, but let's assume it's manageable 
      // or we just fetch counts with Prisma. To be truly enterprise, we use aggregate.
    })
  ])

  const totalPages = Math.ceil(totalItems / pageSize)

  // 6. Calculate Overview Stats
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  let successCount = 0
  let failureCount = 0
  let criticalCount = 0
  let securityCount = 0
  let todayCount = 0

  allEventsForStats.forEach(e => {
    const meta = (e.metadata as Record<string, unknown>) || {}
    if (meta?.status === "SUCCESS") successCount++
    if (meta?.status === "FAILURE") failureCount++
    if (meta?.severity === "critical") criticalCount++
    if (e.action === "SUSPICIOUS_ACTIVITY" || e.action === "SECURITY_VIOLATION") securityCount++
    if (e.createdAt >= todayStart) todayCount++
  })

  // 7. Format Rows
  const formattedEvents: AuditEventRowData[] = events.map(e => {
    const meta = (e.metadata as Record<string, unknown>) || {}
    return {
      id: e.id,
      time: e.createdAt.toLocaleString(),
      user: e.actor ? e.actor.name : (e.actorId || "System"),
      module: e.resource,
      action: e.action,
      entity: e.resourceId || "-",
      status: meta?.status === "SUCCESS" ? "SUCCESS" : "FAILURE",
      severity: (typeof meta?.severity === "string" ? (meta.severity.toUpperCase() as ThreatLevel) : "LOW"),
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      metadata: meta || {}
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader 
        title="Operational Audit Center"
        description="Enterprise read-only view for all security and operational audit trails"
        actions={<RefreshButton />}
      />

      {/* Overview */}
      <AuditOverview 
        totalEvents={allEventsForStats.length}
        successEvents={successCount}
        failureEvents={failureCount}
        criticalEvents={criticalCount}
        securityEvents={securityCount}
        todayEvents={todayCount}
      />

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <AuditSearch />
        <AuditFilter />
      </div>

      {/* Table */}
      <AuditTable events={formattedEvents} />

      {/* Pagination */}
      {totalItems > 0 && (
        <AuditPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
        />
      )}
    </div>
  )
}
