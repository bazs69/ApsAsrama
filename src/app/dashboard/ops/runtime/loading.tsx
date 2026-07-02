import * as React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export default function RuntimeDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Overview Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Gauges Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>

        {/* Right Column: Trends and Stats Skeleton */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Trends Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
          
          {/* Historical Stats Skeleton */}
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>

      {/* System Information Skeleton */}
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}
