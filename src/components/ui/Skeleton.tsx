import * as React from "react"
import { cn } from "@/lib/utils"

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800/60",
        className
      )}
      {...props}
    />
  )
}
