import type { Notification } from "@/lib/notifications/notificationTypes"
import { NotificationCard } from "./NotificationCard"
import EmptyState from "@/components/ui/EmptyState"
import { BellOff } from "lucide-react"

interface NotificationTimelineProps {
  notifications: Notification[]
}

export function NotificationTimeline({ notifications }: NotificationTimelineProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        variant="search"
        title="Tidak Ada Notifikasi Alert"
        description="Tidak ditemukan alert operasional yang cocok dengan kriteria filter aktif Anda."
        icon={BellOff}
      />
    )
  }

  return (
    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
      {notifications.map((notification, idx) => (
        <div key={notification.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Timeline Node */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
            <div className={`w-3 h-3 rounded-full ${notification.isRead ? 'bg-zinc-400' : 'bg-blue-500'}`} />
          </div>
          
          {/* Card Wrapper */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)]">
            <NotificationCard notification={notification} />
          </div>
        </div>
      ))}
    </div>
  )
}
