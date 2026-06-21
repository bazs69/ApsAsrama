"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { Bell, Menu, Search, User as UserIcon, Sun, Moon } from "lucide-react"

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// useSyncExternalStore subscribe noop — hanya dipakai untuk deteksi client vs server
const subscribe = () => () => {}

export default function Topbar({ user }: { user?: { name?: string | null; role?: string } }) {
  // mounted = true hanya di sisi klien (menghindari hydration mismatch)
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  // Sync DOM class whenever theme changes
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <header className="h-20 px-4 md:px-8 flex items-center justify-between glass border-b border-zinc-200 dark:border-zinc-800 z-10 sticky top-0 transition-colors duration-300">
      <div className="flex items-center">
        <button className="md:hidden p-2 text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white mr-4">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="hidden md:flex relative group">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-focus-within:text-primary-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari santri, kamar..." 
            className="bg-zinc-100/60 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all w-64"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Theme Toggle Button — only rendered after mount to avoid hydration mismatch */}
        <button 
          onClick={toggleTheme} 
          className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-xl transition-colors border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/55 dark:bg-zinc-900/40 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
          title={!mounted ? "Toggle Theme" : theme === "dark" ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
          suppressHydrationWarning
        >
          {/* Render placeholder (invisible) on server/before mount to avoid mismatch */}
          {!mounted ? (
            <span className="w-5 h-5 block" />
          ) : theme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-500" />
          ) : (
            <Moon className="w-5 h-5 text-primary-600" />
          )}
        </button>

        <button className="relative p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>

        <div className="flex items-center space-x-3 border-l border-zinc-200 dark:border-zinc-800 pl-4 md:pl-6">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{user?.name || "Admin User"}</span>
            <span className="text-xs text-primary-600 dark:text-primary-400 font-bold tracking-wider">{user?.role || "ADMIN"}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden">
            <UserIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>
      </div>
    </header>
  )
}

