import * as React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export default function NotificationsDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Overview Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <Skeleton className="h-16 rounded-2xl" />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Timeline */}
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-6 w-32 rounded-md" />
          <div className="space-y-4 relative before:absolute before:inset-0 before:mx-auto before:h-full before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between md:even:flex-row-reverse relative">
                <Skeleton className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-4 border-white dark:border-zinc-950 z-10" />
                <Skeleton className="w-[calc(50%-2rem)] h-40 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        
      </div>
    </div>
  )
}
