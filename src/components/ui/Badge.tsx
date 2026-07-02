import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "danger" | "info" | "outline" | "secondary" | "default"
  size?: "xs" | "sm" | "md" | "lg"
}

const variantStyles: Record<string, string> = {
  default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/80",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-transparent",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-transparent",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-transparent",
  outline: "text-zinc-950 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800"
}

const sizeStyles: Record<string, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base"
}

function Badge({ className, variant = "default", size = "sm", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:focus:ring-zinc-300",
        motion.fast,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
