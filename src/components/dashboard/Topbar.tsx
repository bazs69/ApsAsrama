"use client"

import { useSyncExternalStore } from "react"
import { useState, useEffect } from "react"
import { Menu, User as UserIcon, Sun, Moon } from "lucide-react"
import NotificationDropdown from "@/components/dashboard/NotificationDropdown"
import { useSidebar } from "@/components/providers/SidebarProvider"

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem("theme")
  if (stored === "dark" || stored === "light") return stored
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

// useSyncExternalStore subscribe noop — used only for client vs server detection
const subscribe = () => () => { }

export default function Topbar({ user }: { user?: { name?: string | null; role?: string } }) {
  // mounted = true only on client side (avoids hydration mismatch)
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const { toggle: toggleSidebar } = useSidebar()

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
    <header className="h-16 px-4 md:px-8 flex items-center justify-between bg-white dark:bg-zinc-900/90 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 z-10 sticky top-0 transition-colors duration-300">

      {/* ── Left: Mobile menu ── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — desktop hidden */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── Right: Theme toggle + Notification + User ── */}
      <div className="flex items-center space-x-2 md:space-x-3">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-colors border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          title={!mounted ? "Toggle Theme" : theme === "dark" ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
          suppressHydrationWarning
        >
          {!mounted ? (
            <span className="w-5 h-5 block" />
          ) : theme === "dark" ? (
            /* Sun — accent gold (semantic token) */
            <Sun className="w-5 h-5 text-accent-500" />
          ) : (
            /* Moon — primary green */
            <Moon className="w-5 h-5 text-primary-600" />
          )}
        </button>

        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-3 md:pl-4">
          {/* Name + Role badge — desktop only */}
          <div className="hidden md:flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-none">
              {user?.name || "Admin User"}
            </span>
            {/* Role as neutral badge — role is identity, not status */}
            <span className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide leading-none">
              {user?.role || "ADMIN"}
            </span>
          </div>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            <UserIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </div>
        </div>

      </div>
    </header>
  )
}
