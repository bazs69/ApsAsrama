"use client"

import * as React from "react"
import { Toaster } from "react-hot-toast"

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "!bg-white dark:!bg-zinc-900 !text-zinc-900 dark:!text-zinc-100 !border !border-zinc-200 dark:!border-zinc-800 !rounded-2xl !p-4 !shadow-lg !text-sm !font-medium !transition-all !duration-150",
        style: {
          borderRadius: "1rem",
        },
        success: {
          iconTheme: {
            primary: "#10b981", // Emerald-500
            secondary: "#ffffff",
          },
          className: "!bg-white dark:!bg-zinc-900 !text-zinc-900 dark:!text-zinc-100 !border !border-success-200/50 dark:!border-success-900/30 !rounded-2xl !p-4 !shadow-md !shadow-success-500/5",
        },
        error: {
          iconTheme: {
            primary: "#ef4444", // Rose-500
            secondary: "#ffffff",
          },
          className: "!bg-white dark:!bg-zinc-900 !text-zinc-900 dark:!text-zinc-100 !border !border-danger-200/50 dark:!border-danger-900/30 !rounded-2xl !p-4 !shadow-md !shadow-danger-500/5",
        },
        loading: {
          className: "!bg-white dark:!bg-zinc-900 !text-zinc-900 dark:!text-zinc-100 !border !border-zinc-200 dark:!border-zinc-800 !rounded-2xl !p-4 !shadow-md",
        }
      }}
    />
  )
}
