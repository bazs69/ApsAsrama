import * as React from "react"
import { Skeleton } from "@/components/ui/Skeleton"
import TableSkeleton from "@/components/ui/TableSkeleton"

export default function AuditDashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Overview Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Controls Skeleton */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 p-6">
        <table className="w-full">
          <tbody>
            <TableSkeleton rows={10} columns={7} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
