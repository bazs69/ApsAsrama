import { SectionHeader } from "@/components/ui/SectionHeader"
import { breadcrumbStore } from "@/lib/monitoring/breadcrumb"
import { MetricCard } from "@/components/ui/MetricCard"
import { MonitoringCard } from "@/components/ops/MonitoringCard"
import { RequestCard } from "@/components/ops/RequestCard"
import { TimelineItem } from "@/components/ops/TimelineItem"
import { RefreshButton } from "@/components/ops/RefreshButton"
import { StatusBadge } from "@/components/ops/StatusBadge"
import {
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  Terminal,
  Database,
  BarChart,
  ShieldAlert,
  HardDrive
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MonitoringDashboardPage() {
  const allCrumbs = breadcrumbStore.getAll()

  // 1. Compute Metrics
  const requestCrumbs = allCrumbs.filter(b => b.category === "REQUEST")
  const mutationCrumbs = allCrumbs.filter(b => b.category === "MUTATION")
  const errorCrumbs = allCrumbs.filter(b => b.category === "ERROR")

  const totalRequests = requestCrumbs.length
  const successfulRequests = requestCrumbs.filter(b => b.message.includes("(OK)")).length
  const failedRequests = totalRequests - successfulRequests

  const totalMutations = mutationCrumbs.length
  const totalErrors = errorCrumbs.length

  // Parse durations from request messages (e.g., "Request: User::Login (OK) 120ms")
  const durations = requestCrumbs.map(b => {
    const match = b.message.match(/(\d+)ms/)
    return match ? parseInt(match[1], 10) : 0
  }).filter(d => d > 0)

  const avgResponseTime = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0

  const slowestRequest = durations.length > 0 ? Math.max(...durations) : 0
  const fastestRequest = durations.length > 0 ? Math.min(...durations) : 0
  const lastRequestDuration = durations.length > 0 ? durations[durations.length - 1] : 0

  // Recent errors (last 5)
  const recentErrors = [...errorCrumbs].reverse().slice(0, 5)

  // Timeline (last 10)
  const timeline = [...allCrumbs].reverse().slice(0, 10)

  // Recent Requests (last 5)
  const recentRequests = [...requestCrumbs].reverse().slice(0, 5).map(b => {
    // Expected format: "Request: Module::Action (OK) 120ms"
    const match = b.message.match(/Request: (.+?)::(.+?) \((OK|FAIL)\) (\d+)ms/)
    return {
      module: match ? match[1] : "Unknown",
      action: match ? match[2] : b.message,
      success: match ? match[3] === "OK" : false,
      durationMs: match ? parseInt(match[4], 10) : 0,
      timestamp: b.timestamp
    }
  })

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <SectionHeader 
        title="Monitoring Engine"
        description="Real-time application telemetry and activity logging"
        actions={<RefreshButton />}
      />

      {/* 1. Monitoring Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Requests" value={totalRequests} icon={Activity} />
        <MetricCard title="Successful" value={successfulRequests} icon={Activity} badge={<StatusBadge status="HEALTHY" />} />
        <MetricCard title="Failed" value={failedRequests} icon={AlertTriangle} badge={failedRequests > 0 ? <StatusBadge status="UNHEALTHY" /> : undefined} />
        <MetricCard title="Mutations" value={totalMutations} icon={Database} />
        <MetricCard title="Error Events" value={totalErrors} icon={ShieldAlert} />
        <MetricCard title="Avg Response" value={`${avgResponseTime}ms`} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. Request Activity */}
          <MonitoringCard title="Recent Request Activity" icon={Activity}>
            {recentRequests.length > 0 ? (
              <div className="space-y-3">
                {recentRequests.map((req, i) => (
                  <RequestCard
                    key={i}
                    module={req.module}
                    action={req.action}
                    success={req.success}
                    durationMs={req.durationMs}
                    timestamp={req.timestamp}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No recent request activity.
              </div>
            )}
          </MonitoringCard>

          {/* 3. Recent Errors */}
          <MonitoringCard title="Recent System Errors" icon={AlertTriangle}>
            {recentErrors.length > 0 ? (
              <div className="space-y-4">
                {recentErrors.map((err, i) => (
                  <div key={i} className="flex items-start justify-between p-4 bg-danger-50/50 dark:bg-danger-900/10 border border-danger-100 dark:border-danger-900/30 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status="UNHEALTHY" />
                        <span className="text-xs font-semibold text-danger-700 dark:text-danger-400 uppercase">
                          {err.severity}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{err.message}</p>
                      {err.data && (
                        <pre className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(err.data, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No recent errors recorded. System is healthy.
              </div>
            )}
          </MonitoringCard>

        </div>

        {/* Sidebar Column (1/3) */}
        <div className="space-y-8">
          
          {/* 5. Performance Summary */}
          <MonitoringCard title="Performance Summary" icon={Zap}>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Avg Duration</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{avgResponseTime}ms</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Slowest</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{slowestRequest}ms</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Fastest</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{fastestRequest}ms</span>
              </div>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Last Request</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{lastRequestDuration}ms</span>
              </div>
            </div>
          </MonitoringCard>

          {/* 4. Breadcrumb Timeline */}
          <MonitoringCard title="Activity Timeline" icon={Clock}>
            {timeline.length > 0 ? (
              <div className="pt-2">
                {timeline.map((crumb, i) => (
                  <TimelineItem
                    key={i}
                    time={new Date(crumb.timestamp).toLocaleTimeString()}
                    title={crumb.category}
                    description={crumb.message}
                    isLast={i === timeline.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No timeline events yet.
              </div>
            )}
          </MonitoringCard>

          {/* 6. Monitoring Status */}
          <MonitoringCard title="Module Status" icon={BarChart}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span>Adapter Status</span>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">ConsoleAdapter</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <span>Performance Collector</span>
                </div>
                <span className="text-xs font-semibold text-success-600 dark:text-success-400">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <HardDrive className="w-4 h-4 text-zinc-400" />
                  <span>Breadcrumb Store</span>
                </div>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{allCrumbs.length}/50 Used</span>
              </div>
            </div>
          </MonitoringCard>

        </div>
      </div>
    </div>
  )
}
