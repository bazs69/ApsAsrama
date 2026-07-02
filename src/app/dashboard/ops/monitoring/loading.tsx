import * as React from "react"
import { Skeleton } from "@/components/ui/Skeleton"

export default function MonitoringDashboardLoading() {
  return (
    <div className="space-y-8">
      
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* 1. Monitoring Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>

        {/* Sidebar Column (1/3) */}
        <div className="space-y-8">
          <Skeleton className="h-[250px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
          <Skeleton className="h-[200px] rounded-2xl" />
        </div>
        
      </div>
    </div>
  )
}
