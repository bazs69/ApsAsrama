import * as React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export default function SecurityDashboardLoading() {
  return (
    <div className="space-y-8">

      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* 1. Security Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <Skeleton className="h-6 w-40 rounded-md mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          </div>
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[250px] rounded-2xl" />
          <Skeleton className="h-[200px] rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
