import React from "react"

export default function PriorityCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50/50 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
              <div className="pt-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
