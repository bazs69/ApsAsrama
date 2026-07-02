import { SectionHeader } from "@/components/ui/SectionHeader"
import { aggregateNotifications } from "@/lib/notifications/notificationAggregator"
import { 
  countUnread, 
  countCritical, 
  countWarnings,
  groupByCategory
} from "@/lib/notifications/notificationHelper"
import { NotificationOverview } from "@/components/ops/NotificationOverview"
import { NotificationFilter } from "@/components/ops/NotificationFilter"
import { NotificationTimeline } from "@/components/ops/NotificationTimeline"
import { NotificationSummary } from "@/components/ops/NotificationSummary"
import { RefreshButton } from "@/components/ops/RefreshButton"

export const dynamic = "force-dynamic"

export default async function NotificationsDashboardPage({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  // 1. Fetch Aggregated Alerts Server-Side
  const allNotifications = await aggregateNotifications()
  
  // 2. Compute Global Stats
  const total = allNotifications.length
  const unread = countUnread(allNotifications)
  const critical = countCritical(allNotifications)
  const warnings = countWarnings(allNotifications)
  
  // Compute group data for summary (raw data before filter)
  const groupedData = groupByCategory(allNotifications)
  const summaryData = {
    HEALTH: groupedData.HEALTH?.length || 0,
    SECURITY: groupedData.SECURITY?.length || 0,
    MONITORING: groupedData.MONITORING?.length || 0,
    AUDIT: groupedData.AUDIT?.length || 0,
    RUNTIME: groupedData.RUNTIME?.length || 0,
    SYSTEM: groupedData.SYSTEM?.length || 0,
  }

  // 3. Apply Filters Server-Side
  const filterCat = searchParams.category as string
  const filterSev = searchParams.severity as string
  const filterPri = searchParams.priority as string
  const filterUnread = searchParams.unread === "true"

  let filtered = [...allNotifications]
  if (filterCat) filtered = filtered.filter(n => n.category === filterCat)
  if (filterSev) filtered = filtered.filter(n => n.severity === filterSev)
  if (filterPri) filtered = filtered.filter(n => n.priority === filterPri)
  if (filterUnread) filtered = filtered.filter(n => !n.isRead)

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader 
        title="Enterprise Notification Center"
        description="Real-time operational alerts across all platform layers"
        actions={<RefreshButton />}
      />

      {/* Overview Stats */}
      <NotificationOverview 
        total={total}
        unread={unread}
        critical={critical}
        warnings={warnings}
      />

      {/* Filter Bar */}
      <NotificationFilter />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left/Main Column: Timeline */}
        <div className="lg:col-span-3">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            Alerts Timeline
          </h3>
          <NotificationTimeline notifications={filtered} />
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <NotificationSummary summaryData={summaryData} />
        </div>
        
      </div>
    </div>
  )
}
