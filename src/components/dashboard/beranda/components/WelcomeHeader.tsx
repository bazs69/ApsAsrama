"use client"

import React, { useState, useEffect } from "react"
import { DashboardUser } from "../types"
import { useCurrentTime } from "../hooks/useCurrentTime"
import { usePrayerTimes } from "../hooks/usePrayerTimes"
import { Moon, Link as LinkIcon, CloudMoon } from "lucide-react"

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
  const { liveTimeOnly, liveHijri, liveGreeting, liveGregorian } = useCurrentTime()
  const { prayerTimes, loading } = usePrayerTimes("1629")

  const [showThemePrompt, setShowThemePrompt] = useState(false)
  
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 18 || hour < 5) {
      // Check if light mode is active (if no class dark on html)
      if (!document.documentElement.classList.contains('dark')) {
        setShowThemePrompt(true)
      }
    }
  }, [])

  const displayHijri = propHijriDate || liveHijri
  const displayGreeting = propGreeting || liveGreeting

  const displayName = user.name || "Pengguna"
  const displayRole = role || user.role || "MEMBER"

  // Mock weather for now
  const weather = {
    temp: "23°C",
    condition: "Cerah Berawan"
  }

  const activePrayer = "subuh"

  const prayers = [
    { key: "imsak", label: "IMSAK", time: prayerTimes?.imsak || "..." },
    { key: "subuh", label: "SUBUH", time: prayerTimes?.subuh || "..." },
    { key: "terbit", label: "TERBIT", time: prayerTimes?.terbit || "..." },
    { key: "dhuha", label: "DHUHA", time: prayerTimes?.dhuha || "..." },
    { key: "dzuhur", label: "DZUHUR", time: prayerTimes?.dzuhur || "..." },
    { key: "ashar", label: "ASHAR", time: prayerTimes?.ashar || "..." },
    { key: "maghrib", label: "MAGHRIB", time: prayerTimes?.maghrib || "..." },
    { key: "isya", label: "ISYA", time: prayerTimes?.isya || "..." }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* Hero Section */}
      <div className="lg:col-span-8 relative overflow-hidden flex flex-col justify-center p-6 rounded-2xl bg-gradient-to-br from-primary-50/60 via-white to-white dark:from-primary-950/40 dark:via-zinc-950 dark:to-zinc-900/80 border border-primary-100/50 dark:border-zinc-800 shadow-sm transition-all duration-300 group animate-in fade-in zoom-in-95 duration-500 h-full min-h-[120px]">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-72 h-72 bg-primary-500/5 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none transition-all duration-700 group-hover:scale-110 group-hover:bg-primary-500/10"></div>

        <div className="relative z-10 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">Selamat Datang</span>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-snug mb-1">
              {displayName.toUpperCase()}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              {user.email || "bazstiktok69@gmail.com"}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <span className="bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm border border-zinc-200 dark:border-zinc-800">
                {displayRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clock & Prayer Times Section */}
      <div className="lg:col-span-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-500 flex flex-col h-full">
        {/* Top Header Section - Dark Green */}
        <div className="bg-gradient-to-r from-[#032e15] to-[#0a5c2f] px-5 py-4 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-sm">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                {displayGreeting}
              </h1>
              <p className="text-white/80 text-[10px] mt-0.5">
                Istirahatlah yang cukup
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
              <CloudMoon className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-bold text-xs">{weather.temp}</span>
            </div>
            <p className="text-white/90 text-[10px] font-medium mt-1">
              {weather.condition}
            </p>
          </div>
        </div>

        {/* Clock Section */}
        <div className="flex flex-col items-center justify-center pt-4 pb-3 flex-1 bg-gradient-to-b from-sky-50/50 via-white to-orange-50/30 dark:from-zinc-950 dark:to-zinc-950">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e293b] dark:text-zinc-100 tracking-tight leading-none mb-2 font-mono">
            {liveTimeOnly || "00:00:00"}
          </h2>
          
          <div className="bg-[#1e293b] dark:bg-zinc-800 text-white dark:text-zinc-100 px-3 py-1 rounded-full font-bold text-[9px] tracking-widest uppercase mb-2 shadow-sm">
            {liveGregorian}
          </div>
          
          <div className="flex items-center gap-1.5 text-[#1e293b] dark:text-zinc-300 font-bold text-xs">
            <Moon className="w-3.5 h-3.5" />
            <span>{displayHijri}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="px-5">
          <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full rounded-full"></div>
        </div>

        {/* Smart Theme Prompt */}
        {showThemePrompt && (
          <div className="mx-5 mt-3 bg-zinc-900 text-white text-[10px] font-semibold px-3 py-2 rounded-xl flex items-center justify-between shadow-md animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <Moon className="w-3 h-3 text-blue-400" />
              <span>Malam tiba. Pindah ke Dark Mode?</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { document.documentElement.classList.add('dark'); setShowThemePrompt(false) }} className="text-blue-300 hover:text-white transition-colors px-2 py-0.5 rounded bg-white/10">Ya</button>
              <button onClick={() => setShowThemePrompt(false)} className="text-zinc-400 hover:text-white transition-colors">✕</button>
            </div>
          </div>
        )}

        {/* Prayer Times Section */}
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0a5c2f] dark:bg-primary-500"></div>
            <h3 className="text-[#475569] dark:text-zinc-300 font-bold text-[11px]">
              Waktu Sholat Kabupaten Probolinggo
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            {prayers.map((prayer) => {
              const isActive = prayer.key === activePrayer
              return (
                <div
                  key={prayer.key}
                  className={`flex flex-col items-center justify-center py-1 rounded-md border transition-colors ${
                    isActive
                      ? "bg-[#032e15] border-[#032e15] text-white shadow-sm"
                      : "bg-[#f8fafc] border-[#f1f5f9] dark:bg-zinc-900 dark:border-zinc-800 text-[#0f172a] dark:text-zinc-400"
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"}`}>
                    {prayer.label}
                  </span>
                  <span className={`text-xs font-black leading-none ${isActive ? "text-white" : "text-zinc-800 dark:text-zinc-300"}`}>
                    {prayer.time}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold">
            <LinkIcon className="w-3 h-3" />
            <span>Sumber: <a href="https://api.myquran.com" target="_blank" rel="noreferrer" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">api.myquran.com</a></span>
          </div>
        </div>
      </div>
    </div>
  )
}
