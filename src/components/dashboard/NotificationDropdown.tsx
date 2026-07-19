"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, X, CheckCheck, Inbox, Loader2, AlertCircle, Info, CheckCircle, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/app/actions/notifications"

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  isRead: boolean
  metadata: unknown
  createdAt: Date
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30 * 1000 // 30 seconds

// ─── Helper: notification type styling ───────────────────────────────────────

function typeConfig(type: string) {
  switch (type as NotificationType) {
    case "SUCCESS":
      return {
        icon: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
        dot: "bg-emerald-50 dark:bg-emerald-900/200",
      }
    case "WARNING":
      return {
        icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
        dot: "bg-amber-50 dark:bg-amber-900/100",
      }
    case "ERROR":
      return {
        icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
        dot: "bg-red-50 dark:bg-red-900/200",
      }
    default: // INFO
      return {
        icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
        dot: "bg-blue-500",
      }
  }
}

function timeAgo(date: Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1)  return "Baru saja"
  if (mins < 60) return `${mins} menit lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs} jam lalu`
  const days = Math.floor(hrs / 24)
  return `${days} hari lalu`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationDropdown() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await getUnreadNotifications()
      if (result.error) {
        // Only surface error on the initial load
        if (isFirstLoad.current) setError(result.error)
        return
      }
      setNotifications((result.notifications ?? []) as Notification[])
      setUnreadCount(result.unreadCount ?? 0)
      setError(null)
    } catch {
      if (isFirstLoad.current) setError("Gagal memuat notifikasi.")
    } finally {
      if (isFirstLoad.current) {
        setLoading(false)
        isFirstLoad.current = false
      }
    }
  }, [])

  // Initial fetch + polling every 30 s
  // fetchNotifications is called inside a void wrapper to satisfy
  // react-hooks/set-state-in-effect: setState calls happen asynchronously
  useEffect(() => {
    // setTimeout defers execution so setState isn't called synchronously during the effect
    const timeoutId = setTimeout(() => {
      fetchNotifications()
    }, 0)

    const intervalId = setInterval(() => {
      void fetchNotifications()
    }, POLL_INTERVAL_MS)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [fetchNotifications])

  // ── Close on outside click ─────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleMarkAsRead = async (id: string, link?: string | null) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))

    const result = await markAsRead(id)
    if (result.error) {
      // Revert on failure by refetching
      fetchNotifications()
      return
    }
    if (link) {
      setOpen(false)
      router.push(link)
    }
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    // Optimistic update
    const prev = notifications
    const prevCount = unreadCount
    setNotifications([])
    setUnreadCount(0)

    const result = await markAllAsRead()
    setMarkingAll(false)

    if (result.error) {
      setNotifications(prev)
      setUnreadCount(prevCount)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => Math.max(0, prev - 1))

    const result = await deleteNotification(id)
    setDeletingId(null)
    if (result.error) {
      fetchNotifications()
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell trigger */}
      <button
        id="notification-bell"
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-xl hover:bg-zinc-100/60 dark:hover:bg-zinc-800"
        aria-label="Notifikasi"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? "animate-[wiggle_0.4s_ease-in-out]" : ""}`} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/200 text-white text-[10px] font-bold border-2 border-white dark:border-zinc-950 px-0.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[500px] flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden"
          role="dialog"
          aria-label="Panel Notifikasi"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full px-2 py-0.5 font-medium">
                  {unreadCount} belum dibaca
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  title="Tandai semua sudah dibaca"
                  className="p-1.5 text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {markingAll
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCheck className="w-4 h-4" />
                  }
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Tutup panel notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {/* Loading skeleton */}
            {loading && (
              <div className="flex flex-col gap-3 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-3/4" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
                <button
                  onClick={() => { setLoading(true); fetchNotifications() }}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Inbox className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Semua sudah dibaca</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Tidak ada notifikasi baru saat ini.</p>
              </div>
            )}

            {/* Notification list */}
            {!loading && !error && notifications.length > 0 && (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifications.map(n => {
                  const { icon, dot } = typeConfig(n.type)
                  const isDeleting = deletingId === n.id

                  return (
                    <li
                      key={n.id}
                      className={`relative flex gap-3 px-4 py-3 transition-colors duration-150 group ${
                        !n.isRead
                          ? "bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      } ${isDeleting ? "opacity-40 pointer-events-none" : ""}`}
                    >
                      {/* Type icon */}
                      <div className="mt-0.5">{icon}</div>

                      {/* Content */}
                      <button
                        className="flex-1 text-left min-w-0"
                        onClick={() => handleMarkAsRead(n.id, n.link)}
                        aria-label={`Buka: ${n.title}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 leading-snug truncate">
                            {n.title}
                          </p>
                          {/* Unread dot */}
                          {!n.isRead && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${dot}`} />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </button>

                      {/* Delete button — visible on hover */}
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(n.id) }}
                        disabled={isDeleting}
                        title="Hapus notifikasi"
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 rounded-lg transition-all flex-shrink-0 self-start mt-0.5"
                        aria-label="Hapus notifikasi"
                      >
                        {isDeleting
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <X className="w-3.5 h-3.5" />
                        }
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!loading && notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center">
                Menampilkan {notifications.length} notifikasi belum dibaca
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
