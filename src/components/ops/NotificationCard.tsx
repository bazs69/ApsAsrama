import type { Notification } from "@/lib/notifications/notificationTypes"
import { NotificationBadge } from "./NotificationBadge"
import { ExternalLink, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"
import { Tooltip } from "@/components/ui/Tooltip"

interface NotificationCardProps {
  notification: Notification
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const isUnread = !notification.isRead
  const time = new Date(notification.createdAt).toLocaleString()

  return (
    <Card 
      className={cn(
        "group hover:-translate-y-0.5 hover:shadow-md",
        isUnread 
          ? "bg-white dark:bg-zinc-900 shadow-md" 
          : "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800 shadow-sm opacity-85 hover:opacity-100",
        notification.priority === "CRITICAL" && isUnread && "border-red-500/50 dark:border-red-500/30 shadow-red-500/5",
        motion.normal,
        motion.scaleHover
      )}
      role="article"
      aria-label={`${notification.priority} priority ${notification.category} notification: ${notification.title}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {isUnread && (
              <Tooltip content="Unread message">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" aria-label="Unread" />
              </Tooltip>
            )}
            <NotificationBadge type="category" value={notification.category} />
            <NotificationBadge type="severity" value={notification.severity} />
            <NotificationBadge type="priority" value={notification.priority} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap">
            <Clock className="w-3 h-3" />
            <time dateTime={new Date(notification.createdAt).toISOString()}>{time}</time>
          </div>
        </div>

        <div className="pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
          <h4 className={cn(
            "text-base font-bold mb-1",
            isUnread ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-700 dark:text-zinc-300"
          )}>
            {notification.title}
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
            {notification.description}
          </p>
          
          <div className="flex items-center justify-between mt-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 dark:text-zinc-500">
              Source: <span className="text-zinc-600 dark:text-zinc-300">{notification.source}</span>
            </span>
            
            {notification.actionUrl && (
              <a 
                href={notification.actionUrl}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                View Details
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
