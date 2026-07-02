import * as React from "react"
import { Skeleton } from "./Skeleton"

interface TableSkeletonProps {
  /** Number of skeleton rows to show. Default: 5. */
  rows?: number
  /** Number of columns that match the real table. Default: 5. */
  columns?: number
}

/**
 * TableSkeleton
 *
 * A reusable skeleton loading state for any data table in the application.
 * Prevents layout shift by preserving the exact table structure.
 * Works inside any <tbody> element.
 */
export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  const colWidths = [
    "w-40",   // col 1 — usually name/avatar
    "w-52",   // col 2 — usually email/detail
    "w-24",   // col 3 — usually tag/badge
    "w-20",   // col 4 — usually date
    "w-16",   // col 5 — usually actions
  ]

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-5 py-4">
              {colIdx === 0 ? (
                // First column: avatar + text block
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 rounded-md w-28" />
                    <Skeleton className="h-2.5 rounded-md w-16" />
                  </div>
                </div>
              ) : colIdx === columns - 1 ? (
                // Last column: action buttons placeholder
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="w-7 h-7 rounded-lg" />
                  <Skeleton className="w-7 h-7 rounded-lg" />
                </div>
              ) : (
                // Middle columns: text line
                <Skeleton
                  className={`h-3 rounded-md ${colWidths[colIdx] ?? "w-32"}`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
