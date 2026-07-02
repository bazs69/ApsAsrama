"use client"

import React from "react"
import { DashboardUser } from "../types"
import { useCurrentTime } from "../hooks/useCurrentTime"

interface WelcomeHeaderProps {
  user: DashboardUser;
  role?: string;
  currentTime?: string;
  hijriDate?: string;
  greeting?: string;
  motivation?: string;
}

export default function WelcomeHeader({
  user,
  role,
  currentTime: propCurrentTime,
  hijriDate: propHijriDate,
  greeting: propGreeting,
  motivation = "Terhubung dalam Pengabdian, Bertumbuh dalam Kebaikan."
}: WelcomeHeaderProps) {
  const { liveTime, liveHijri, liveGreeting, liveGregorian } = useCurrentTime()

  const displayTime = propCurrentTime || liveTime
  const displayHijri = propHijriDate || liveHijri
  const displayGreeting = propGreeting || liveGreeting

  const displayName = user.name || "Pengguna"
  const displayRole = role || user.role || "MEMBER"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Hero Section */}
      <div className="lg:col-span-8 relative overflow-hidden flex flex-col justify-center p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-none transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-200/50 group animate-in fade-in zoom-in-95 duration-500 h-full min-h-[140px]">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-72 h-72 bg-primary-500/5 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:scale-110 group-hover:bg-primary-500/10"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white mb-2 tracking-tight leading-snug">
            {displayGreeting}, <span className="text-primary-600 dark:text-primary-400">{displayName}</span>
          </h1>
          <div className="flex items-center space-x-3 mt-4">
            <span className="bg-zinc-100/80 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
              {displayRole}
            </span>
            {motivation && (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                {motivation}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Clock Banner */}
      <div className="lg:col-span-4 beranda-card flex items-center space-x-5 h-full relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500 delay-75">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/40 dark:to-primary-900/10 text-primary-600 dark:text-primary-400 flex items-center justify-center text-2xl shadow-inner border border-primary-200/50 dark:border-primary-800/30 transition-transform group-hover:scale-105 duration-300" aria-hidden="true">
          🌙
        </div>
        <div className="flex-1">
          <div className="text-2xl font-mono font-extrabold text-zinc-900 dark:text-white leading-none mb-1.5 flex items-center tracking-tight">
            <span aria-label="Waktu saat ini">{displayTime || "..."}</span>
          </div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex flex-col space-y-0.5">
            <span>{liveGregorian || "Memuat tanggal..."}</span>
            <span className="text-primary-600 dark:text-primary-400 font-extrabold tracking-wide" aria-label="Tanggal Hijriyah">{displayHijri || "Memuat Hijriyah..."}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
