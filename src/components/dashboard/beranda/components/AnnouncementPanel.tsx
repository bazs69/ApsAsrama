import React from "react"
import Link from "next/link"
import { ArrowRight, Megaphone } from "lucide-react"
import { Announcement, AnnouncementPriority } from "../types"
import { formatTimeAgo } from "@/lib/utils/formatTimeAgo"

interface AnnouncementPanelProps {
  announcements: Announcement[]
  viewAllHref?: string
}

const MAX_VISIBLE = 3

const priorityConfig: Record<AnnouncementPriority, { bg: string; border: string; badge: string; badgeText: string; titleColor: string; labelText: string }> = {
  normal: {
    bg: "bg-zinc-50 dark:bg-zinc-900/40",
    border: "border-zinc-200 dark:border-zinc-800",
    badge: "bg-zinc-200 dark:bg-zinc-700",
    badgeText: "text-zinc-600 dark:text-zinc-300",
    titleColor: "text-zinc-900 dark:text-white",
    labelText: "Normal"
  },
  important: {
    bg: "bg-warning-50 dark:bg-warning-900/10",
    border: "border-warning-500/20",
    badge: "bg-warning-100 dark:bg-warning-900/30",
    badgeText: "text-warning-700 dark:text-warning-400",
    titleColor: "text-zinc-900 dark:text-white",
    labelText: "Penting"
  },
  urgent: {
    bg: "bg-danger-50 dark:bg-danger-900/10",
    border: "border-danger-500/20",
    badge: "bg-danger-100 dark:bg-danger-900/30",
    badgeText: "text-danger-700 dark:text-danger-400",
    titleColor: "text-zinc-900 dark:text-white",
    labelText: "Mendesak"
  }
}

export default function AnnouncementPanel({ announcements, viewAllHref = "/dashboard/announcements" }: AnnouncementPanelProps) {
  // Announcement section hanya dirender apabila ada data
  if (!announcements || announcements.length === 0) return null

  const visible = announcements.slice(0, MAX_VISIBLE)
  const hasMore = announcements.length > MAX_VISIBLE

  return (
    <section
      role="region"
      aria-labelledby="announcement-heading"
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 id="announcement-heading" className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          Pengumuman
        </h2>
        {hasMore && (
          <Link
            href={viewAllHref}
            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:opacity-70 flex items-center gap-1 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            Lihat Semua Pengumuman
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((ann) => {
          const style = priorityConfig[ann.priority]
          return (
            <article
              key={ann.id}
              className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50/60 group ${style.border} ${ann.priority === 'urgent' ? 'shadow-[0_4px_20px_rgba(239,68,68,0.08)] dark:shadow-[0_4px_20px_rgba(239,68,68,0.05)]' : 'shadow-sm'}`}
              aria-label={`Pengumuman: ${ann.title}`}
            >
              {/* Decorative side accent for Urgent/Important */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bg.replace('bg-', 'bg-').split(' ')[0]} opacity-80`}></div>

              <div className="flex flex-col gap-3 pl-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${style.badge} ${style.badgeText} shadow-sm border border-current/10`}>
                      {style.labelText}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                    <span className="text-[10px] text-zinc-400 font-semibold tracking-wide">
                      {formatTimeAgo(ann.publishedAt)}
                    </span>
                  </div>
                  {ann.author && (
                    <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {ann.author}
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className={`font-extrabold text-sm mb-1.5 ${style.titleColor} group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors`}>{ann.title}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                    {ann.content}
                  </p>
                </div>
                
                {ann.actionHref && (
                  <div className="pt-2">
                    <Link
                      href={ann.actionHref}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 rounded-md px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 ${style.badgeText}`}
                    >
                      {ann.actionLabel || "Selengkapnya"}
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
