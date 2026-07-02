import { Activity, Clock } from "lucide-react"

interface RequestCardProps {
  module: string
  action: string
  success: boolean
  durationMs: number
  timestamp: string | number
}

export function RequestCard({ module, action, success, durationMs, timestamp }: RequestCardProps) {
  const isSuccess = success
  
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg ${isSuccess ? "bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400" : "bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400"}`}>
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{module}</span>
            <span className="text-zinc-300 dark:text-zinc-600">•</span>
            <span className="text-zinc-600 dark:text-zinc-400 text-sm">{action}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            <Clock className="w-3 h-3" />
            <span>{typeof timestamp === "number" ? new Date(timestamp).toLocaleTimeString() : timestamp}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end">
        <span className={`text-xs font-bold uppercase tracking-wider ${isSuccess ? "text-success-600 dark:text-success-500" : "text-danger-600 dark:text-danger-500"}`}>
          {isSuccess ? "Success" : "Failed"}
        </span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
          {durationMs}ms
        </span>
      </div>
    </div>
  )
}
