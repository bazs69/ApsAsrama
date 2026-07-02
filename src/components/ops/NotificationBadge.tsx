import type { NotificationSeverity, NotificationPriority, NotificationCategory } from "@/lib/notifications/notificationTypes"
import { AlertCircle, ShieldAlert, Activity, Database, Server, Info, AlertTriangle, ShieldX } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { Tooltip } from "@/components/ui/Tooltip"

interface NotificationBadgeProps {
  type: "category" | "severity" | "priority"
  value: NotificationCategory | NotificationSeverity | NotificationPriority
  className?: string
}

export function NotificationBadge({ type, value, className }: NotificationBadgeProps) {
  if (type === "category") {
    const val = value as NotificationCategory
    const config = {
      HEALTH: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", icon: Activity },
      SECURITY: { color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800", icon: ShieldAlert },
      MONITORING: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800", icon: AlertCircle },
      AUDIT: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800", icon: Database },
      RUNTIME: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800", icon: Server },
      SYSTEM: { color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700", icon: Info },
    }
    const c = config[val] || config.SYSTEM
    const Icon = c.icon
    return (
      <Tooltip content={`Alert Category: ${val}`}>
        <Badge size="xs" className={cn("gap-1.5 uppercase tracking-wider rounded-md", c.color, className)}>
          <Icon className="w-3 h-3" />
          {val}
        </Badge>
      </Tooltip>
    )
  }

  if (type === "severity") {
    const val = value as NotificationSeverity
    const config = {
      CRITICAL: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", icon: ShieldX },
      ERROR: { color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20", icon: AlertCircle },
      WARNING: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", icon: AlertTriangle },
      INFO: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: Info },
    }
    const c = config[val] || config.INFO
    const Icon = c.icon
    return (
      <Tooltip content={`Alert Severity Level: ${val}`}>
        <Badge size="sm" className={cn("gap-1.5", c.color, className)}>
          <Icon className="w-3.5 h-3.5" />
          {val}
        </Badge>
      </Tooltip>
    )
  }

  // priority
  const val = value as NotificationPriority
  const config = {
    CRITICAL: "bg-red-600 text-white dark:bg-red-500 border-transparent",
    HIGH: "bg-orange-500 text-white dark:bg-orange-500/90 border-transparent",
    MEDIUM: "bg-amber-400 text-amber-950 dark:bg-amber-500/90 dark:text-amber-950 border-transparent",
    LOW: "bg-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300 border-transparent",
  }
  return (
    <Tooltip content={`Alert Processing Priority: ${val}`}>
      <Badge size="xs" className={cn("rounded uppercase tracking-wider", config[val] || config.LOW, className)}>
        {val}
      </Badge>
    </Tooltip>
  )
}
