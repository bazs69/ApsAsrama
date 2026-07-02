import React from "react"
import { ClipboardList, Calendar, Activity, Server, ShieldCheck, LucideIcon } from "lucide-react"
import { RecentActivityItem, ActivityCategory } from "../types"
import { formatTimeAgo } from "@/lib/utils/formatTimeAgo"

interface RecentActivityProps {
  activities: RecentActivityItem[]
}

const categoryConfig: Record<ActivityCategory, { icon: LucideIcon, bg: string, text: string }> = {
  ASSIGNMENT: { icon: ClipboardList, bg: "bg-primary-500/10", text: "text-primary-600 dark:text-primary-400" },
  ABSENSI: { icon: Calendar, bg: "bg-info-500/10", text: "text-info-600 dark:text-info-400" },
  MONITORING: { icon: Activity, bg: "bg-success-500/10", text: "text-success-600 dark:text-success-400" },
  SYSTEM: { icon: Server, bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-400" },
  SECURITY: { icon: ShieldCheck, bg: "bg-danger-500/10", text: "text-danger-600 dark:text-danger-400" },
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="beranda-card flex flex-col items-center justify-center py-10 text-center animate-in slide-in-from-bottom-2 duration-300 min-h-[300px]">
        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700 shadow-sm" aria-hidden="true">
          <Activity className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-zinc-900 dark:text-white font-bold mb-1">Belum Ada Aktivitas</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs mx-auto">
          Aktivitas terbaru Anda akan muncul di sini secara otomatis.
        </p>
      </div>
    )
  }

  return (
    <div className="beranda-card animate-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-6">Aktivitas Terbaru</h2>
      
      <div className="relative space-y-2 pl-2" role="feed" aria-label="Linimasa aktivitas terbaru">
        {/* Timeline Connecting Line */}
        <div className="absolute left-[1.75rem] top-6 bottom-6 w-px bg-zinc-200 dark:bg-zinc-800/80" aria-hidden="true"></div>

        {activities.map((act) => {
          const config = categoryConfig[act.category] || categoryConfig.SYSTEM
          const Icon = config.icon
          
          return (
            <div key={act.id} className="relative flex items-start justify-between group p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-2xl transition-colors duration-200" role="article">
              <div className="flex items-start space-x-4 z-10 w-full">
                <div className={`w-9 h-9 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ring-4 ring-white dark:ring-zinc-950 shadow-sm group-hover:scale-110 transition-transform duration-200`} aria-hidden="true">
                  <Icon className={`w-4 h-4 ${config.text}`} />
                </div>
                <div className="flex-1 pt-0.5 min-w-0">
                  <div className="flex justify-between items-start w-full gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug truncate">
                      {act.title}
                    </p>
                    {act.meta && (
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
                        {act.meta}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                    {act.actor && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">{act.actor}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
