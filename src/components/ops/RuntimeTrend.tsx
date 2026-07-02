import { ReactNode } from "react"

interface TrendDataPoint {
  value: number
  timestamp: number
}

interface RuntimeTrendProps {
  title: string
  data: TrendDataPoint[]
  maxValue?: number
  unit?: string
  icon?: ReactNode
}

export function RuntimeTrend({ title, data, maxValue, unit = "", icon }: RuntimeTrendProps) {
  // If maxValue is not provided, dynamically find max for scaling
  const effectiveMax = maxValue || Math.max(...data.map(d => d.value), 1)

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      </div>
      
      <div className="flex-1 min-h-[120px] flex items-end gap-1 px-1">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
            No history available
          </div>
        ) : (
          data.map((point, i) => {
            const heightPercent = Math.min(100, Math.max(2, (point.value / effectiveMax) * 100))
            return (
              <div 
                key={i} 
                className="flex-1 bg-primary-100 hover:bg-primary-300 dark:bg-primary-900/40 dark:hover:bg-primary-700 transition-colors rounded-t-sm group relative"
                style={{ height: `${heightPercent}%` }}
                role="img"
                aria-label={`Value ${point.value.toFixed(1)}${unit} at ${new Date(point.timestamp).toLocaleTimeString()}`}
              >
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-zinc-100 text-[10px] rounded pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  {point.value.toFixed(1)}{unit}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="flex justify-between items-center mt-3 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold border-t border-zinc-100 dark:border-zinc-800 pt-2">
        <span>Oldest</span>
        <span>Latest</span>
      </div>
    </div>
  )
}
