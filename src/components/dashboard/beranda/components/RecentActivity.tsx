"use client"

import React, { useEffect, useState } from "react"
import { ClipboardList, Calendar, Activity, Server, ShieldCheck, AlertTriangle, LucideIcon } from "lucide-react"
import { RecentActivityItem, ActivityCategory } from "../types"
import { formatTimeAgo } from "@/lib/utils/formatTimeAgo"
import { getRecentActivities } from "@/app/actions/dashboardActions"

interface RecentActivityProps {
  activities?: RecentActivityItem[]
}

const categoryConfig: Record<string, { icon: LucideIcon, bg: string, text: string }> = {
  ASSIGNMENT: { icon: ClipboardList, bg: "bg-primary-500/10", text: "text-primary-600 dark:text-primary-400" },
  ABSENSI: { icon: Calendar, bg: "bg-info-500/10", text: "text-info-600 dark:text-info-400" },
  MONITORING: { icon: Activity, bg: "bg-success-500/10", text: "text-success-600 dark:text-success-400" },
  SYSTEM: { icon: Server, bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-400" },
  SECURITY: { icon: ShieldCheck, bg: "bg-danger-500/10", text: "text-danger-600 dark:text-danger-400" },
}

export default function RecentActivity({ activities: initialActivities }: RecentActivityProps) {
  const [activities, setActivities] = useState<RecentActivityItem[]>(initialActivities || [])
  const [loading, setLoading] = useState(!initialActivities)

  useEffect(() => {
    // If not provided via props, fetch from DB
    if (!initialActivities) {
      async function loadActivities() {
        try {
          const res = await getRecentActivities()
          if (res.success && res.data) {
            setActivities(res.data as RecentActivityItem[])
          }
        } catch (error) {
          console.error("Failed to load activities", error)
        } finally {
          setLoading(false)
        }
      }
      loadActivities()
    }
  }, [initialActivities])

  if (loading) {
    return (
      <div className="beranda-card animate-pulse min-h-[300px]">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="beranda-card flex flex-col items-center justify-center py-10 text-center animate-in slide-in-from-bottom-2 duration-300 min-h-[300px]">
        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200 dark:border-zinc-700 shadow-sm" aria-hidden="true">
          <Activity className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
        </div>
        <h3 className="text-zinc-900 dark:text-white font-bold mb-1">Belum Ada Aktivitas</h3>
        <p className="text-[#032e15]/70 dark:text-zinc-400 text-sm max-w-xs mx-auto">
          Aktivitas terbaru sistem Anda akan otomatis muncul di sini.
        </p>
      </div>
    )
  }

  return (
    <div className="beranda-card animate-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-6">Aktivitas Terbaru</h2>
      
      <div className="relative space-y-2 pl-2" role="feed" aria-label="Linimasa aktivitas terbaru">
        <div className="absolute left-[1.75rem] top-6 bottom-6 w-px bg-zinc-200 dark:bg-zinc-800/80" aria-hidden="true"></div>

        {activities.map((act) => {
          const config = categoryConfig[act.category] || categoryConfig.SYSTEM
          const Icon = config.icon
          
          return (
            <div key={act.id} className={`relative flex items-start justify-between group p-3 rounded-2xl transition-colors duration-200 ${act.category === 'SECURITY' ? 'bg-danger-50 hover:bg-danger-100 dark:bg-danger-900/10 dark:hover:bg-danger-900/20' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`} role="article">
              <div className="flex items-start space-x-4 z-10 w-full">
                <div className={`w-9 h-9 mt-0.5 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ring-4 ring-white dark:ring-zinc-950 shadow-sm group-hover:scale-110 transition-transform duration-200`} aria-hidden="true">
                  {act.category === 'SECURITY' ? <AlertTriangle className={`w-4 h-4 ${config.text}`} /> : <Icon className={`w-4 h-4 ${config.text}`} />}
                </div>
                <div className="flex-1 pt-0.5 min-w-0">
                  <div className="flex justify-between items-start w-full gap-2">
                    <p className={`text-sm font-semibold leading-snug truncate ${act.category === 'SECURITY' ? 'text-danger-700 dark:text-danger-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {act.title}
                    </p>
                    {act.meta && (
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-[#032e15]/70 dark:text-zinc-400 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
                        {act.meta}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-[#032e15]/70 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                    {act.actor && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                        <span className="text-[10px] text-[#032e15]/70 dark:text-zinc-400 font-semibold">{act.actor}</span>
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
