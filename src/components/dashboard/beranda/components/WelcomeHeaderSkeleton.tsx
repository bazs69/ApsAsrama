import React from "react"

export default function WelcomeHeaderSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Hero Section Skeleton */}
      <div className="lg:col-span-8 relative overflow-hidden flex flex-col justify-center p-8 rounded-2xl bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50/50 border border-zinc-200 dark:border-zinc-800 shadow-sm animate-pulse h-full min-h-[140px]">
        <div className="space-y-4">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4 max-w-sm"></div>
          <div className="flex items-center space-x-3">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 max-w-xs"></div>
          </div>
        </div>
      </div>
      
      {/* Clock Banner Skeleton */}
      <div className="lg:col-span-4 beranda-card flex items-center space-x-5 h-full animate-pulse">
        <div className="w-14 h-14 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4"></div>
          <div className="space-y-1.5">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
