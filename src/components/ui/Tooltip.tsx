import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  position?: "top" | "bottom" | "left" | "right"
  className?: string
}

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2 origin-top",
  left: "right-full top-1/2 -translate-y-1/2 mr-2 origin-right",
  right: "left-full top-1/2 -translate-y-1/2 ml-2 origin-left",
}

export function Tooltip({
  content,
  children,
  position = "top",
  className,
}: TooltipProps) {
  return (
    <div className="relative group/tooltip inline-block">
      {children}
      <div
        className={cn(
          "absolute z-50 invisible opacity-0 scale-95 pointer-events-none whitespace-nowrap",
          "group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100",
          "px-2 py-1 text-[10px] font-semibold text-zinc-50 dark:text-zinc-900 bg-zinc-900/95 dark:bg-zinc-50/95 rounded-md shadow-md border border-zinc-800 dark:border-zinc-200",
          positionClasses[position],
          motion.fast,
          className
        )}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  )
}
