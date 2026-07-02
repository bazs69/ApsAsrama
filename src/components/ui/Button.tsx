import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./Spinner"
import { motion } from "@/lib/ui/motion"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "xs" | "sm" | "md" | "lg"
  isLoading?: boolean
  loading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantStyles: Record<string, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 shadow-sm border border-transparent focus-visible:ring-primary-500",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 border border-transparent focus-visible:ring-zinc-500",
  outline: "border border-zinc-200 bg-transparent hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800 focus-visible:ring-zinc-500",
  ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-transparent focus-visible:ring-zinc-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 shadow-sm border border-transparent focus-visible:ring-rose-500",
}

const sizeStyles: Record<string, string> = {
  xs: "h-7 px-3 text-xs rounded-lg",
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-10 px-5 text-sm rounded-xl",
  lg: "h-11 px-8 text-base rounded-2xl",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, loading, disabled, iconLeft, iconRight, children, ...props }, ref) => {
    const isButtonLoading = isLoading || loading

    return (
      <button
        ref={ref}
        disabled={isButtonLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center font-semibold focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
          motion.fast,
          motion.scalePress,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isButtonLoading && <Spinner size="sm" variant={variant === "primary" || variant === "danger" ? "secondary" : "primary"} className="mr-2" />}
        {!isButtonLoading && iconLeft && <span className="mr-2">{iconLeft}</span>}
        {children}
        {!isButtonLoading && iconRight && <span className="ml-2">{iconRight}</span>}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
