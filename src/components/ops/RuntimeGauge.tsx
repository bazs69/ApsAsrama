import { ReactNode } from "react"
import { Progress } from "@/components/ui/Progress"
import { Card, CardContent } from "@/components/ui/Card"
import { Tooltip } from "@/components/ui/Tooltip"
import { motion } from "@/lib/ui/motion"
import { cn } from "@/lib/utils"

interface RuntimeGaugeProps {
  label: string
  value: number
  max: number
  unit: string
  description?: string
  icon?: ReactNode
}

export function RuntimeGauge({ label, value, max, unit, description, icon }: RuntimeGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  let indicatorColor = "bg-success-500 dark:bg-success-400" // Green
  if (percentage >= 85) {
    indicatorColor = "bg-danger-500 dark:bg-danger-400" // Red
  } else if (percentage >= 70) {
    indicatorColor = "bg-warning-500 dark:bg-warning-400" // Yellow
  }

  const tooltipMsg = `${value.toFixed(1)} ${unit} / ${max.toFixed(0)} ${unit} (${percentage.toFixed(1)}%)`

  return (
    <Card className={cn("hover:-translate-y-0.5 hover:shadow-md", motion.fast, motion.scaleHover)}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h3>
              {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value.toFixed(1)}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">{unit}</span>
          </div>
        </div>
        
        <Tooltip content={tooltipMsg} position="top" className="w-full">
          <div className="cursor-help py-1">
            <Progress value={percentage} max={100} indicatorColor={indicatorColor} />
          </div>
        </Tooltip>
        
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">0 {unit}</span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{percentage.toFixed(1)}%</span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{max.toFixed(0)} {unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}
