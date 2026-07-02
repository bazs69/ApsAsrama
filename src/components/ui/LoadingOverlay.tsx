import * as React from "react"
import { Spinner } from "./Spinner"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"

export interface LoadingOverlayProps {
  visible: boolean
  message?: string
  absolute?: boolean
  className?: string
}

export function LoadingOverlay({
  visible,
  message,
  absolute = false,
  className,
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className={cn(
        "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3",
        absolute ? "absolute inset-0 rounded-2xl" : "fixed inset-0",
        motion.fast,
        className
      )}
      role="alert"
      aria-busy="true"
      aria-label={message || "Loading..."}
    >
      <Spinner size="lg" variant="primary" />
      {message && (
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  )
}
