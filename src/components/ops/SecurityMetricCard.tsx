import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { Tooltip } from "@/components/ui/Tooltip"
import { motion } from "@/lib/ui/motion"
import { cn } from "@/lib/utils"

interface SecurityMetricCardProps {
  title: string
  value: number
  max: number
  icon: LucideIcon
  dangerThreshold?: number
  warningThreshold?: number
  unit?: string
}

export function SecurityMetricCard({
  title,
  value,
  max,
  icon: Icon,
  dangerThreshold,
  warningThreshold,
  unit = "events",
}: SecurityMetricCardProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const isDanger = dangerThreshold !== undefined && value >= dangerThreshold
  const isWarning = !isDanger && warningThreshold !== undefined && value >= warningThreshold

  const barClass = isDanger
    ? "bg-danger-500"
    : isWarning
    ? "bg-warning-500"
    : "bg-primary-500"

  const textClass = isDanger
    ? "text-danger-600 dark:text-danger-400"
    : isWarning
    ? "text-warning-600 dark:text-warning-400"
    : "text-zinc-900 dark:text-zinc-100"

  const tooltipMsg = `${value} of ${max} ${unit} (${pct.toFixed(1)}%)`

  return (
    <Card
      className={cn(
        "hover:-translate-y-0.5 hover:shadow-md",
        motion.fast,
        motion.scaleHover
      )}
      aria-label={`${title}: ${value} ${unit}`}
      tabIndex={0}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
        </div>
        <div className={`text-3xl font-bold mb-3 ${textClass}`}>{value}</div>
        
        <Tooltip content={tooltipMsg} position="top" className="w-full">
          <div
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={`${title} progress bar`}
            className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden cursor-help py-0.5"
          >
            <div
              className={cn("h-full rounded-full", motion.slow, barClass)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </Tooltip>
        
        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 block font-medium">{unit}</span>
      </CardContent>
    </Card>
  )
}
