import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
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
        />
        {helperText && (
          <p className={cn("text-xs mt-1.5 font-medium", error ? "text-danger-500" : "text-zinc-500 dark:text-zinc-400")}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
