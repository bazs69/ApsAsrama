import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import AuditLogClient from "@/components/dashboard/audit-log/AuditLogClient"
import { getAuditLogs, getAuditLogActions } from "@/app/actions/audit"
import { Metadata } from "next"
import { ComponentProps } from "react"

export const metadata: Metadata = {
  title: "Audit Log | Sistem Asrama",
  description: "Riwayat seluruh perubahan data dalam sistem asrama"
}

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const permissions = session.user.permissions || []
  if (!permissions.includes("audit.view")) redirect("/dashboard/forbidden")

  const sp = await searchParams
  const page = sp.page ? parseInt(sp.page) : 1
  const action = sp.action || ""
  const performedBy = sp.user || ""
  const dateFrom = sp.dateFrom || ""
  const dateTo = sp.dateTo || ""
  const search = sp.search || ""

  const [logsResult, actionsResult] = await Promise.all([
    getAuditLogs({ page, limit: 25, action, performedBy, dateFrom, dateTo, search }),
    getAuditLogActions()
  ])

  return (
    <AuditLogClient
      initialLogs={((logsResult as { logs?: unknown[] }).logs || []) as unknown as ComponentProps<typeof AuditLogClient>["initialLogs"]}
      total={(logsResult as { total?: number }).total || 0}
      totalPages={(logsResult as { totalPages?: number }).totalPages || 1}
      currentPage={page}
      availableActions={(actionsResult as { actions?: string[] }).actions || []}
      permissions={permissions}
      initialFilters={{ action, performedBy, dateFrom, dateTo, search }}
    />
  )
}
