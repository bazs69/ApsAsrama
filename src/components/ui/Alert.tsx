import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "@/lib/ui/motion"
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "error" | "info"
  title?: string
  description?: string
  onClose?: () => void
}

const variantStyles = {
  success: "bg-success-50/60 dark:bg-success-950/10 border-success-200/50 dark:border-success-900/30 text-success-800 dark:text-success-400",
  warning: "bg-warning-50/60 dark:bg-warning-950/10 border-warning-200/50 dark:border-warning-900/30 text-warning-800 dark:text-warning-400",
  error: "bg-danger-50/60 dark:bg-danger-950/10 border-danger-200/50 dark:border-danger-900/30 text-danger-800 dark:text-danger-400",
  info: "bg-primary-50/60 dark:bg-primary-950/10 border-primary-200/50 dark:border-primary-900/30 text-primary-800 dark:text-primary-400",
}

const iconColors = {
  success: "text-success-600 dark:text-success-500",
  warning: "text-warning-600 dark:text-warning-500",
  error: "text-danger-600 dark:text-danger-500",
  info: "text-primary-600 dark:text-primary-500",
}

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
}

export function Alert({
  variant = "info",
  title,
  description,
  onClose,
  className,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[variant]

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3.5 p-4 border rounded-2xl shadow-sm",
        variantStyles[variant],
        motion.fast,
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Icon className={cn("h-5 w-5", iconColors[variant])} />
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-bold text-sm tracking-wide mb-1 leading-snug">
            {title}
          </h5>
        )}
        {description && (
          <p className="text-xs leading-relaxed opacity-90">
            {description}
          </p>
        )}
        {children && <div className="text-xs mt-2">{children}</div>}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            "flex-shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-zinc-950/5 dark:hover:bg-white/5",
            motion.fast
          )}
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
