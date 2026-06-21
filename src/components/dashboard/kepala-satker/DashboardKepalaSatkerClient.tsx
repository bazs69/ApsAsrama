"use client"

import { useState, useEffect } from "react"
import { Users, AlertTriangle, TrendingUp, CheckCircle, Activity, FileText } from "lucide-react"

interface DashboardKepalaSatkerProps {
  stats: {
    namaSatker: string
    totalAnggota: number
    sangatAktif: number
    aktif: number
    cukupAktif: number
    kurangAktif: number
    statusLaporan: "SUBMITTED" | "DRAFT" | "BELUM_LAPOR"
  }
}

export default function DashboardKepalaSatkerClient({ stats }: DashboardKepalaSatkerProps) {
  const [time, setTime] = useState<string>("")
  const [gregorianDate, setGregorianDate] = useState<string>("")
  const [hijriDate, setHijriDate] = useState<string>("")

  useEffect(() => {
    const updateTimeAndDates = () => {
      const now = new Date()
      
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      setTime(`${hours}:${minutes}:${seconds} WIB`)

      const gregStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      })
      setGregorianDate(gregStr)

      try {
        const hijriStr = new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }).format(now)
        setHijriDate(`${hijriStr} H`)
      } catch {
        setHijriDate("")
      }
    }

    updateTimeAndDates()
    const timer = setInterval(updateTimeAndDates, 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusBadge = () => {
    switch (stats.statusLaporan) {
      case "SUBMITTED":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Sudah Lapor</span>
          </span>
        )
      case "DRAFT":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
            <FileText className="w-3.5 h-3.5" />
            <span>Draft</span>
          </span>
        )
      default:
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Belum Lapor</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-zinc-900 border border-blue-200 dark:border-blue-900/50 p-6 rounded-2xl shadow-sm transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Dashboard Kepala Satker
          </h1>
          <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
            Satker: {stats.namaSatker}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl py-3 px-5 min-w-[290px] shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-zinc-900 dark:text-white leading-none mb-1.5 flex items-center space-x-1.5">
              <span>{time || "Memuat waktu..."}</span>
            </div>
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex flex-col space-y-0.5">
              <span>{gregorianDate}</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{hijriDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
             <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-1">Status Laporan Bulan Ini</p>
             <div className="mt-2">{getStatusBadge()}</div>
          </div>
          <FileText className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
        </div>
      </div>

      {/* Stats Cards Grid */}
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-8 mb-4">Distribusi Keaktifan Bulan Berjalan</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Anggota */}
        <div className="glass rounded-2xl p-5 border border-blue-500/20 transition-all hover:scale-[1.02] duration-300 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Total Anggota</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stats.totalAnggota}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-emerald-500/20 transition-all hover:scale-[1.02] duration-300 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Sangat Aktif</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.sangatAktif}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-teal-500/20 transition-all hover:scale-[1.02] duration-300 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Aktif</p>
            <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stats.aktif}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-amber-500/20 transition-all hover:scale-[1.02] duration-300 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Cukup Aktif</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.cukupAktif}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-red-500/20 transition-all hover:scale-[1.02] duration-300 flex flex-col justify-between">
          <div className="flex items-center space-x-3 mb-3">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Kurang Aktif</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.kurangAktif}</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
