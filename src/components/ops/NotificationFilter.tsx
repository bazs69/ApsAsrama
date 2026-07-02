"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Filter, X } from "lucide-react"
import { motion } from "@/lib/ui/motion"
import { cn } from "@/lib/utils"

export function NotificationFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get("category") || ""
  const currentSeverity = searchParams.get("severity") || ""
  const currentPriority = searchParams.get("priority") || ""
  const unreadOnly = searchParams.get("unread") === "true"

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const toggleUnread = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (unreadOnly) {
      params.delete("unread")
    } else {
      params.set("unread", "true")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(pathname)
  }

  const hasFilters = currentCategory || currentSeverity || currentPriority || unreadOnly

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 mr-2">
        <Filter className="w-4 h-4" />
        Filters
      </div>
      
      <select 
        value={currentCategory}
        onChange={(e) => setFilter("category", e.target.value)}
        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-primary-500 outline-none"
        aria-label="Filter by Category"
      >
        <option value="">All Categories</option>
        <option value="HEALTH">Health</option>
        <option value="SECURITY">Security</option>
        <option value="MONITORING">Monitoring</option>
        <option value="AUDIT">Audit</option>
        <option value="RUNTIME">Runtime</option>
        <option value="SYSTEM">System</option>
      </select>

      <select 
        value={currentSeverity}
        onChange={(e) => setFilter("severity", e.target.value)}
        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-primary-500 outline-none"
        aria-label="Filter by Severity"
      >
        <option value="">All Severities</option>
        <option value="INFO">Info</option>
        <option value="WARNING">Warning</option>
        <option value="ERROR">Error</option>
        <option value="CRITICAL">Critical</option>
      </select>

      <select 
        value={currentPriority}
        onChange={(e) => setFilter("priority", e.target.value)}
        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-primary-500 outline-none"
        aria-label="Filter by Priority"
      >
        <option value="">All Priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
        <input 
          type="checkbox" 
          checked={unreadOnly} 
          onChange={toggleUnread}
          className="rounded border-zinc-300 text-primary-600 focus:ring-primary-500 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700" 
        />
        Unread Only
      </label>

      {hasFilters && (
        <button 
          onClick={clearFilters}
          className={cn(
            "ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg",
            motion.fast
          )}
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  )
}
