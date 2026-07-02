import { NotificationBadge } from "./NotificationBadge"
import type { NotificationCategory } from "@/lib/notifications/notificationTypes"

interface NotificationSummaryProps {
  summaryData: Record<NotificationCategory, number>
}

export function NotificationSummary({ summaryData }: NotificationSummaryProps) {
  const categories = Object.entries(summaryData) as [NotificationCategory, number][]
  
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Alerts Summary
      </h3>
      <ul className="space-y-3">
        {categories.map(([category, count]) => {
          if (count === 0) return null
          return (
            <li key={category} className="flex items-center justify-between">
              <NotificationBadge type="category" value={category} />
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {count}
              </span>
            </li>
          )
        })}
        {Object.values(summaryData).every(v => v === 0) && (
          <li className="text-sm text-zinc-500 dark:text-zinc-400">
            No alerts found.
          </li>
        )}
      </ul>
    </div>
  )
}
