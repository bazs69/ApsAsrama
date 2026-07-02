import toast from "react-hot-toast"

/**
 * Enterprise Toast Helper
 * 
 * Consistent helper for triggering styled notifications.
 * Wraps react-hot-toast to ensure unified classes and icons.
 */
export const showToast = {
  success: (message: string) => {
    toast.success(message)
  },
  error: (message: string) => {
    toast.error(message)
  },
  warning: (message: string) => {
    toast(message, {
      icon: "⚠️",
      className: "!border-warning-200/50 dark:!border-warning-900/30 !shadow-md !shadow-warning-500/5",
    })
  },
  info: (message: string) => {
    toast(message, {
      icon: "ℹ️",
      className: "!border-primary-200/50 dark:!border-primary-900/30 !shadow-md !shadow-primary-500/5",
    })
  },
}
