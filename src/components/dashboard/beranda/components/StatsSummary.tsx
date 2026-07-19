"use client"

import React, { useEffect, useState } from "react"
import { Users, MapPin, Activity, UserCheck, UserX, UserMinus } from "lucide-react"
import { getDashboardStats } from "@/app/actions/dashboardActions"

interface StatsData {
  totalSantri: number
  totalSatker: number
  kehadiran: {
    percentage: number
    hadir: number
    izinSakit: number
    alpa: number
  }
}

export default function StatsSummary() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getDashboardStats()
        if (res.success && res.data) {
          setStats(res.data)
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800"></div>
        ))}
      </div>
    )
  }

  // Fallbacks if data fails to load
  const data = stats || {
    totalSantri: 0,
    totalSatker: 0,
    kehadiran: { percentage: 0, hadir: 0, izinSakit: 0, alpa: 0 }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-500">

      {/* Total Santri */}
      <div className="relative overflow-hidden rounded-[2rem] p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary-300 group">
        <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
          <Users className="w-24 h-24 text-primary-600" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3 border border-primary-100 dark:border-primary-800/30 group-hover:bg-primary-100 transition-colors">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">Total Santri Aktif</p>
          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{data.totalSantri.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {/* Total Tempat Penugasan */}
      <div className="relative overflow-hidden rounded-[2rem] p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-info-300 group">
        <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-300">
          <MapPin className="w-24 h-24 text-info-600" />
        </div>
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-info-50 dark:bg-info-900/20 text-info-600 dark:text-info-400 flex items-center justify-center mb-3 border border-info-100 dark:border-info-800/30 group-hover:bg-info-100 transition-colors">
            <MapPin className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">Total Tempat Penugasan</p>
          <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">{data.totalSatker.toLocaleString('id-ID')}</h3>
        </div>
      </div>

      {/* Kehadiran (Absensi) */}
      <div className="relative overflow-hidden rounded-[2rem] p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-success-300 group">
        <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-300">
          <Activity className="w-24 h-24 text-success-600" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 flex items-center justify-center mb-3 border border-success-100 dark:border-success-800/30 group-hover:bg-success-100 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">Tingkat Kehadiran</p>
            <h3 className={`text-4xl font-black tracking-tight ${data.kehadiran.percentage >= 80 ? 'text-success-600 dark:text-success-400' : data.kehadiran.percentage >= 50 ? 'text-warning-600 dark:text-warning-400' : 'text-danger-600 dark:text-danger-400'}`}>{data.kehadiran.percentage}%</h3>
          </div>

          <div className="flex gap-4 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400"><UserCheck className="w-3 h-3 text-success-500" /> {data.kehadiran.hadir.toLocaleString('id-ID')} Hadir</div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400"><UserMinus className="w-3 h-3 text-warning-500" /> {data.kehadiran.izinSakit.toLocaleString('id-ID')} Izin</div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400"><UserX className="w-3 h-3 text-danger-500" /> {data.kehadiran.alpa.toLocaleString('id-ID')} Alpa</div>
          </div>
        </div>
      </div>

    </div>
  )
}
