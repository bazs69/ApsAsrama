import { Activity } from "lucide-react"
import { StatusBadge } from "./StatusBadge"
import { Card, CardContent } from "@/components/ui/Card"
import type { HealthCheckResult } from "@/lib/health/healthTypes"

interface HealthCardProps {
  check: HealthCheckResult
}

export function HealthCard({ check }: HealthCardProps) {
  // Try to parse out the name nicely
  const title = check.name.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          </div>
          <StatusBadge status={check.status} />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2" title={check.message}>
          {check.message}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{new Date(check.timestamp).toLocaleTimeString()}</span>
          <span>{check.durationMs}ms</span>
        </div>
      </CardContent>
    </Card>
  )
}
