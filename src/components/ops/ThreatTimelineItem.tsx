import { ShieldAlert, Clock } from "lucide-react"
import type { ThreatLevel } from "@/lib/security/threatDetector"
import { ThreatBadge } from "./ThreatBadge"

interface ThreatTimelineItemProps {
  time: string
  severity: ThreatLevel | string
  source?: string
  description: string
  isLast?: boolean
}

function toThreatLevel(s: string): ThreatLevel {
  if (s === "CRITICAL" || s === "HIGH" || s === "MEDIUM") return s as ThreatLevel
  return "LOW"
}

export function ThreatTimelineItem({ time, severity, source, description, isLast = false }: ThreatTimelineItemProps) {
  const level = toThreatLevel(severity.toUpperCase())

  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px bg-zinc-200 dark:bg-zinc-800" />
      )}
      <div className="relative flex-none w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 z-10">
        <ShieldAlert className="w-4 h-4" />
      </div>
      <div className="flex-1 pb-5 pt-1.5">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <ThreatBadge level={level} />
          {source && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
              {source}
            </span>
          )}
          <span className="ml-auto text-xs flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
            <Clock className="w-3 h-3" />
            {time}
          </span>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 break-words">{description}</p>
      </div>
    </div>
  )
}
