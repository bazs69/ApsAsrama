import { History, TrendingUp, TrendingDown, Maximize, Activity } from "lucide-react"

interface RuntimeHistoryStats {
  latestSampleTime: string
  avgHeap: number
  avgRss: number
  peakMemory: number
  lowestMemory: number
  peakCpu: number
  avgCpu: number
}

interface RuntimeHistoryCardProps {
  stats: RuntimeHistoryStats
}

export function RuntimeHistoryCard({ stats }: RuntimeHistoryCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
          <History className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Historical Statistics</h3>
      </div>
      
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <ClockIcon /> Latest Sample
          </dt>
          <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{stats.latestSampleTime}</dd>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Average Heap
          </dt>
          <dd className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.avgHeap.toFixed(1)} <span className="text-sm font-normal text-zinc-500">MB</span></dd>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> Average RSS
          </dt>
          <dd className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.avgRss.toFixed(1)} <span className="text-sm font-normal text-zinc-500">MB</span></dd>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Peak Memory (RSS)
          </dt>
          <dd className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.peakMemory.toFixed(1)} <span className="text-sm font-normal text-zinc-500">MB</span></dd>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5" /> Lowest Memory (RSS)
          </dt>
          <dd className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{stats.lowestMemory.toFixed(1)} <span className="text-sm font-normal text-zinc-500">MB</span></dd>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
          <dt className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Maximize className="w-3.5 h-3.5" /> CPU Peak / Avg
          </dt>
          <dd className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {stats.peakCpu.toFixed(1)}% <span className="text-sm font-normal text-zinc-400">/</span> {stats.avgCpu.toFixed(1)}%
          </dd>
        </div>
      </dl>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
