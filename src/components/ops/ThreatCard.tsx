import { ThreatBadge } from "./ThreatBadge"
import { Card, CardContent } from "@/components/ui/Card"
import type { ThreatLevel } from "@/lib/security/threatDetector"

interface ThreatCardProps {
  title: string
  severity: ThreatLevel
  source?: string
  description?: string
  timestamp?: number
}

export function ThreatCard({ title, severity, source, description, timestamp }: ThreatCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow"
      role="article"
      aria-label={`Threat event: ${title}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
            {title}
          </h4>
          <ThreatBadge level={severity} />
        </div>
        {source && (
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Source: <span className="text-zinc-700 dark:text-zinc-300">{source}</span>
          </p>
        )}
        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 break-words">{description}</p>
        )}
        {timestamp && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
