import { RuntimeMetricCard } from "@/components/ops/RuntimeMetricCard"
import { Clock, HardDrive, Cpu, Activity, Database, Hash } from "lucide-react"

interface RuntimeOverviewProps {
  uptimeFormatted: string
  heapUsed: number
  heapTotal: number
  rss: number
  cpuUsage: number
  sampleCount: number
}

export function RuntimeOverview({
  uptimeFormatted,
  heapUsed,
  heapTotal,
  rss,
  cpuUsage,
  sampleCount
}: RuntimeOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <RuntimeMetricCard 
        title="Uptime" 
        value={uptimeFormatted} 
        icon={Clock} 
      />
      <RuntimeMetricCard 
        title="Heap Used" 
        value={`${heapUsed.toFixed(1)} MB`} 
        icon={Database} 
      />
      <RuntimeMetricCard 
        title="Heap Total" 
        value={`${heapTotal.toFixed(1)} MB`} 
        icon={HardDrive} 
      />
      <RuntimeMetricCard 
        title="RSS Memory" 
        value={`${rss.toFixed(1)} MB`} 
        icon={Activity} 
      />
      <RuntimeMetricCard 
        title="CPU Usage" 
        value={`${cpuUsage.toFixed(1)}%`} 
        icon={Cpu} 
      />
      <RuntimeMetricCard 
        title="Sample Count" 
        value={sampleCount} 
        icon={Hash} 
      />
    </div>
  )
}

