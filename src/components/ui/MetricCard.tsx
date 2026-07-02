import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "./Card"
import { cn } from "@/lib/utils"
import { Tooltip } from "./Tooltip"
import { motion } from "@/lib/ui/motion"

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  badge?: ReactNode
  tooltip?: string
  className?: string
}

export function MetricCard({ title, value, subtitle, icon: Icon, badge, tooltip, className }: MetricCardProps) {
  const cardContent = (
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl">
          <Icon className="w-5 h-5" />
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-1">{title}</h4>
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>
        )}
      </div>
    </CardContent>
  )

  return (
    <Card 
      className={cn(
        "flex flex-col justify-between h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5",
        motion.fast,
        motion.scaleHover,
        className
      )}
    >
      {tooltip ? (
        <Tooltip content={tooltip} position="top" className="w-full h-full text-left">
          {cardContent}
        </Tooltip>
      ) : (
        cardContent
      )}
    </Card>
  )
}
