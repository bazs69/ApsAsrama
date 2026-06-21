"use client"

import { useState, useEffect } from "react"
import { Users, DoorOpen, TrendingUp, Calendar, ArrowRight, UserPlus, Home, Settings } from "lucide-react"
import Link from "next/link"

interface DashboardClientProps {
  stats: {
    totalSantri: number
    availableRooms: number
    occupiedRooms: number
    maintenanceRooms: number
    totalRooms: number
    occupancyRate: number
    totalBeds: number
    occupiedBeds: number
    availableBeds: number
    roomStats: {
      roomNumber: string
      beds: number
      occupied: number
      rate: number
    }[]
    recentActivities: {
      id: string
      name: string
      roomNumber: string | null
      createdAt: string
    }[]
  }
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const [time, setTime] = useState<string>("")
  const [gregorianDate, setGregorianDate] = useState<string>("")
  const [hijriDate, setHijriDate] = useState<string>("")

  useEffect(() => {
    const updateTimeAndDates = () => {
      const now = new Date()
      
      // Real-time Clock HH:MM:SS WIB
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      setTime(`${hours}:${minutes}:${seconds} WIB`)

      // Gregorian Date (e.g. Selasa, 19 Mei 2026)
      const gregStr = now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      })
      setGregorianDate(gregStr)

      // Hijri Date using native Intl (e.g. 2 Dzulhijjah 1447 H)
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

  // Format dates for recent activities
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 1) return "Baru saja"
    if (diffMins < 60) return `${diffMins} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    return `${diffDays} hari yang lalu`
  }

  // calculations for the SVG Donut chart
  const totalRooms = stats.totalRooms || 1
  const availPercent = (stats.availableRooms / totalRooms) * 100
  const occupPercent = (stats.occupiedRooms / totalRooms) * 100

  // SVG parameters
  const radius = 50
  const circumference = 2 * Math.PI * radius

  // Stroke offsets
  const strokeDashoffsetOccupied = circumference - (occupPercent / 100) * circumference
  const strokeDashoffsetAvailable = circumference - (availPercent / 100) * circumference
  // const strokeDashoffsetMaintenance = circumference - (maintPercent / 100) * circumference

  return (
    <div className="space-y-6">
      {/* Welcome & Islamic Clock Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Beranda Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Selamat datang kembali! Berikut adalah ringkasan asrama santri Anda hari ini.</p>
        </div>
        
        {/* Dynamic Islamic Clock Banner */}
        <div className="flex items-center space-x-4 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl py-3 px-5 min-w-[290px] shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20 text-xl">
            🌙
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-zinc-900 dark:text-white leading-none mb-1.5 flex items-center space-x-1.5">
              <span>{time || "12:00:00 WIB"}</span>
            </div>
            <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex flex-col space-y-0.5">
              <span>{gregorianDate || "Memuat tanggal..."}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hijriDate || "Memuat Hijriyah..."}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Santri */}
        <div className="glass rounded-2xl p-6 border border-primary-500/20 transition-all hover:scale-[1.02] duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-500/10">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-1">Total Santri Aktif</p>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.totalSantri}</h3>
          </div>
        </div>

        {/* Kamar Tersedia */}
        <div className="glass rounded-2xl p-6 border border-emerald-500/20 transition-all hover:scale-[1.02] duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <DoorOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-1">Kamar Tersedia</p>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.availableRooms}</h3>
          </div>
        </div>


        {/* Tingkat Keterisian */}
        <div className="glass rounded-2xl p-6 border border-blue-500/20 transition-all hover:scale-[1.02] duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold mb-1">Tingkat Keterisian Kamar</p>
            <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.occupancyRate}%</h3>
          </div>
        </div>
      </div>

      {/* Analitik Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Ring Chart (Status Kamar) */}
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Proporsi Status Kamar</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs">Proporsi ketersediaan seluruh kamar asrama.</p>
          </div>

          <div className="py-6 flex items-center justify-center relative">
            {/* SVG Donut Circle */}
            <svg width="180" height="180" className="transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="16"
                fill="transparent"
              />
              {/* Occupied Slice (Blue) */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="stroke-primary-500"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetOccupied}
                strokeLinecap="round"
              />
              {/* Available Slice (Emerald) - Stacked with offset */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="stroke-emerald-500 dark:stroke-emerald-400"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffsetAvailable}
                strokeLinecap="round"
                transform={`rotate(${stats.occupiedRooms * (360 / totalRooms)} 90 90)`}
              />

            </svg>
            {/* Center label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{stats.totalRooms}</span>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Kamar</span>
            </div>
          </div>

          {/* Legends */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                <span className="text-zinc-600 dark:text-zinc-350">Tersedia</span>
              </div>
              <span className="text-zinc-900 dark:text-white font-bold">{stats.availableRooms} Kamar ({Math.round(availPercent)}%)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <span className="text-zinc-600 dark:text-zinc-350">Terisi Penuh</span>
              </div>
              <span className="text-zinc-900 dark:text-white font-bold">{stats.occupiedRooms} Kamar ({Math.round(occupPercent)}%)</span>
            </div>

          </div>
        </div>

        {/* SVG Bar Chart (Tingkat Hunian per Lantai) */}
        <div className="lg:col-span-2 glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Tingkat Keterisian Kamar</h2>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs">Data keterisian kamar berdasarkan kapasitas dan jumlah penghuni kamar.</p>
          </div>

          {stats.roomStats.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400 dark:text-zinc-550 text-xs italic">
              Belum ada data kamar terdaftar.
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <div className="flex items-end h-48 py-4 border-b border-zinc-150 dark:border-zinc-850 min-w-max space-x-6 px-4">
                {stats.roomStats.map((rs, idx) => {
                  const heightPercent = Math.max(10, Math.min(100, rs.rate))
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-4 w-12 group relative">
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full mb-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-[10px] text-zinc-800 dark:text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 text-center pointer-events-none whitespace-nowrap shadow-md dark:shadow-xl">
                        <div>Kapasitas Terisi: {rs.occupied} / {rs.beds}</div>
                        <div className="font-bold text-primary-600 dark:text-primary-400">Hunian: {rs.rate}%</div>
                      </div>

                      {/* Bar Pillar */}
                      <div className="w-6 bg-zinc-150 dark:bg-zinc-850 rounded-lg h-36 flex items-end overflow-hidden relative border border-zinc-200/50 dark:border-zinc-800/50">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm transition-all duration-1000"
                        />
                      </div>

                      {/* Room Label */}
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-450 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">{rs.roomNumber}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bar Chart Legend */}
          <div className="flex items-center space-x-6 text-xs mt-3 pt-3 border-t border-zinc-150 dark:border-zinc-900">
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 bg-gradient-to-t from-primary-600 to-primary-400 rounded-sm"></div>
              <span className="text-zinc-650 dark:text-zinc-400">Kapasitas Terisi (%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 bg-zinc-150 dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-800/50 rounded-sm"></div>
              <span className="text-zinc-650 dark:text-zinc-400">Kapasitas Kosong</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Pendaftaran Santri Terbaru</h2>
            {stats.recentActivities.length === 0 ? (
              <p className="text-zinc-500 dark:text-zinc-550 text-sm italic py-4">Belum ada santri terdaftar di sistem.</p>
            ) : (
              <div className="space-y-6">
                {stats.recentActivities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-500 dark:text-zinc-400">
                        <Users className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-zinc-700 dark:text-zinc-200 text-sm">
                          <span className="font-bold text-zinc-900 dark:text-white">{act.name}</span>
                          {" "}telah terdaftar sebagai santri baru.
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-550 mt-1 flex items-center space-x-1.5">
                          <Calendar className="w-3 h-3" />
                          <span>{formatTimeAgo(act.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    {act.roomNumber ? (
                      <span className="bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400 rounded-lg px-2.5 py-1 text-xs font-bold">
                        Kamar {act.roomNumber}
                      </span>
                    ) : (
                      <span className="bg-zinc-150 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 rounded-lg px-2.5 py-1 text-xs">
                        Belum Pilih Kamar
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-850/65 mt-6 flex justify-end">
            <Link
              href="/dashboard/residents"
              className="text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-350 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <span>Lihat Semua Direktori</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between transition-colors duration-300">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Aksi Cepat</h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/residents"
                className="w-full bg-primary-600/10 hover:bg-primary-600/20 border border-primary-500/20 text-primary-600 dark:text-primary-400 rounded-xl py-3.5 px-4 font-bold text-sm transition-all text-left flex items-center justify-between shadow-sm shadow-primary-500/5"
              >
                <span className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Santri</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/rooms"
                className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl py-3.5 px-4 font-bold text-sm transition-all text-left flex items-center justify-between shadow-sm shadow-emerald-500/5"
              >
                <span className="flex items-center space-x-2">
                  <Home className="w-4 h-4" />
                  <span>Alokasikan Kamar</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/settings"
                className="w-full bg-zinc-100 dark:bg-zinc-800/40 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-750 text-zinc-600 dark:text-zinc-350 rounded-xl py-3.5 px-4 font-bold text-sm transition-all text-left flex items-center justify-between"
              >
                <span className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Pengaturan Sistem</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-zinc-100/50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 mt-6 text-[11px] text-zinc-550 dark:text-zinc-500 leading-relaxed transition-colors duration-300">
            💡 **Tips Penggunaan**: Status kamar terisi penuh akan berubah secara otomatis saat Anda mendaftarkan santri baru ke kamar tersebut sesuai batas kapasitas kamarnya.
          </div>
        </div>
      </div>
    </div>
  )
}
