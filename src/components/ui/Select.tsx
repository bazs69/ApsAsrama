import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  helperText?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            "flex h-10 w-full rounded-xl border bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:border-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-danger-500 focus-visible:ring-danger-500/50 focus-visible:border-danger-500"
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
            motion.fast,
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        >
          {children}
        </select>
        {helperText && (
          <p className={cn("text-xs mt-1.5 font-medium", error ? "text-danger-500" : "text-zinc-500 dark:text-zinc-400")}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
