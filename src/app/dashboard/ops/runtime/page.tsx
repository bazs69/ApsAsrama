import { SectionHeader } from "@/components/ui/SectionHeader"
import { getRuntimeSnapshot } from "@/lib/runtime/runtimeSnapshot"
import { getSampleHistory, getSampleCount } from "@/lib/runtime/runtimeMetrics"
import { getSystemStatus } from "@/lib/health/healthReporter"
import { RuntimeOverview } from "@/components/ops/RuntimeOverview"
import { RuntimeGauge } from "@/components/ops/RuntimeGauge"
import { RuntimeTrend } from "@/components/ops/RuntimeTrend"
import { RuntimeHistoryCard } from "@/components/ops/RuntimeHistoryCard"
import { RuntimeInfoCard } from "@/components/ops/RuntimeInfoCard"
import { RefreshButton } from "@/components/ops/RefreshButton"
import { Database, Activity, Cpu } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function RuntimeDashboardPage() {
  // 1. Fetch Real-time Data directly from memory
  const currentSnapshot = getRuntimeSnapshot()
  const history = getSampleHistory()
  const sampleCount = getSampleCount()
  const healthReport = await getSystemStatus()

  // 2. Format Uptime (from seconds)
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  // 3. Process Historical Data
  const heapTrend = history.map(h => ({ value: h.snapshot.heapUsedMB, timestamp: h.timestamp }))
  const rssTrend = history.map(h => ({ value: h.snapshot.rssMB, timestamp: h.timestamp }))
  
  // Approximate CPU Usage as a percentage based on user+system diffs or raw values
  // Note: cpuUser and cpuSystem are in microseconds. To get CPU usage %, we need interval deltas.
  // We'll use a mock/derived value for % if we only have absolute microseconds, or just show total seconds
  // For the sake of a gauge, let's represent CPU as a relative percentage of max seen or simulated from load.
  // Actually, we'll calculate CPU delta between last two samples if available.
  let cpuPercent = 0
  if (history.length >= 2) {
    const last = history[history.length - 1]
    const prev = history[history.length - 2]
    const timeDeltaMs = last.timestamp - prev.timestamp
    const userDeltaUs = last.snapshot.cpuUser - prev.snapshot.cpuUser
    const sysDeltaUs = last.snapshot.cpuSystem - prev.snapshot.cpuSystem
    // (microseconds / 1000) / ms_elapsed
    if (timeDeltaMs > 0) {
      cpuPercent = ((userDeltaUs + sysDeltaUs) / 1000 / timeDeltaMs) * 100
    }
  }

  // Fallback if we only have 1 sample, we just use a tiny amount
  const cpuUsageDisplay = cpuPercent || 0.1

  const cpuTrend = history.map((h, i, arr) => {
    if (i === 0) return { value: 0, timestamp: h.timestamp }
    const prev = arr[i - 1]
    const tDelta = h.timestamp - prev.timestamp
    const cpuDelta = (h.snapshot.cpuUser - prev.snapshot.cpuUser) + (h.snapshot.cpuSystem - prev.snapshot.cpuSystem)
    const pct = tDelta > 0 ? ((cpuDelta / 1000) / tDelta) * 100 : 0
    return { value: pct, timestamp: h.timestamp }
  })

  // 4. Calculate Stats for History Card
  let avgHeap = 0, avgRss = 0, peakMem = 0, lowMem = Number.MAX_VALUE, peakCpu = 0, avgCpu = 0
  if (history.length > 0) {
    const sumHeap = history.reduce((acc, h) => acc + h.snapshot.heapUsedMB, 0)
    const sumRss = history.reduce((acc, h) => acc + h.snapshot.rssMB, 0)
    avgHeap = sumHeap / history.length
    avgRss = sumRss / history.length
    
    history.forEach(h => {
      if (h.snapshot.rssMB > peakMem) peakMem = h.snapshot.rssMB
      if (h.snapshot.rssMB < lowMem) lowMem = h.snapshot.rssMB
    })

    const cpuValues = cpuTrend.map(c => c.value)
    peakCpu = Math.max(...cpuValues)
    avgCpu = cpuValues.reduce((a, b) => a + b, 0) / (cpuValues.length || 1)
  }
  if (lowMem === Number.MAX_VALUE) lowMem = 0

  const latestSampleTime = history.length > 0 
    ? new Date(history[history.length - 1].timestamp).toLocaleTimeString() 
    : "No samples"

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader 
        title="Enterprise Runtime Dashboard"
        description="Real-time process telemetry, memory allocation, and historical runtime metrics"
        actions={<RefreshButton />}
      />

      {/* Overview Metrics */}
      <RuntimeOverview 
        uptimeFormatted={formatUptime(currentSnapshot.processUptime)}
        heapUsed={currentSnapshot.heapUsedMB}
        heapTotal={currentSnapshot.heapTotalMB}
        rss={currentSnapshot.rssMB}
        cpuUsage={cpuUsageDisplay}
        sampleCount={sampleCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gauges (2/3 width on desktop via col-span-2 if we wanted, but let's do 3 columns total) */}
        <div className="lg:col-span-1 space-y-6">
          <RuntimeGauge 
            label="Heap Memory"
            description="V8 Engine Heap Utilization"
            value={currentSnapshot.heapUsedMB}
            max={currentSnapshot.heapTotalMB || 1} // max is total heap
            unit="MB"
            icon={<Database className="w-5 h-5" />}
          />
          <RuntimeGauge 
            label="RSS Memory"
            description="Resident Set Size (System RAM)"
            value={currentSnapshot.rssMB}
            max={1024 * 2} // Assuming 2GB max for display purposes if no hard limit is known
            unit="MB"
            icon={<Activity className="w-5 h-5" />}
          />
          <RuntimeGauge 
            label="CPU Load"
            description="Node.js Event Loop CPU Load"
            value={cpuUsageDisplay}
            max={100} // Percentage
            unit="%"
            icon={<Cpu className="w-5 h-5" />}
          />
        </div>

        {/* Right Column: Trends and Stats (2/3 width) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Trend Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            <RuntimeTrend 
              title="Heap Usage Trend"
              data={heapTrend}
              unit="MB"
              icon={<Database className="w-4 h-4" />}
            />
            <RuntimeTrend 
              title="RSS Memory Trend"
              data={rssTrend}
              unit="MB"
              icon={<Activity className="w-4 h-4" />}
            />
          </div>
          
          {/* Historical Stats */}
          <RuntimeHistoryCard 
            stats={{
              latestSampleTime,
              avgHeap,
              avgRss,
              peakMemory: peakMem,
              lowestMemory: lowMem,
              peakCpu,
              avgCpu
            }}
          />
        </div>
      </div>

      {/* System Information */}
      <RuntimeInfoCard 
        info={{
          nodeVersion: healthReport.diagnostics.nodeVersion,
          platform: currentSnapshot.platform,
          arch: currentSnapshot.arch,
          pid: currentSnapshot.pid,
          environment: healthReport.diagnostics.environment,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          // eslint-disable-next-line react-hooks/purity
          bootTime: new Date(Date.now() - (currentSnapshot.processUptime * 1000)).toLocaleString()
        }}
      />
    </div>
  )
}
