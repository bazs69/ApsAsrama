import * as React from "react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: "sm" | "md" | "lg"
  variant?: "primary" | "secondary" | "muted"
}

const sizeClasses = {
  sm: "h-4 w-4 stroke-[2.5]",
  md: "h-6 w-6 stroke-2",
  lg: "h-8 w-8 stroke-2",
}

const variantClasses = {
  primary: "text-blue-600 dark:text-blue-500",
  secondary: "text-zinc-900 dark:text-zinc-100",
  muted: "text-zinc-400 dark:text-zinc-500",
}

export function Spinner({
  size = "md",
  variant = "muted",
  className,
  ...props
}: SpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn(
        "animate-spin",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="loading"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
