import { type ReactNode } from "react"
import { Clock } from "lucide-react"

interface TimelineItemProps {
  time: string
  title: string
  description?: string
  icon?: ReactNode
  isLast?: boolean
}

export function TimelineItem({ time, title, description, icon, isLast = false }: TimelineItemProps) {
  return (
    <div className="relative flex gap-4">
      {/* Line connecting items */}
      {!isLast && (
        <div className="absolute left-[19px] top-8 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
      )}
      
      {/* Icon */}
      <div className="relative flex-none w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 z-10">
        {icon ?? <Clock className="w-4 h-4" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-6 pt-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h4>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{time}</span>
        </div>
        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 break-words">{description}</p>
        )}
      </div>
    </div>
  )
}
