"use client"

import * as React from "react"
import { SearchX, Database, AlertCircle } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { motion } from "@/lib/ui/motion"

export interface EmptyStateProps {
  title?: string
  description?: string
  isFiltered?: boolean
  onClear?: () => void
  clearLabel?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  variant?: "page" | "card" | "table" | "dashboard" | "search" | "error"
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  title,
  description,
  isFiltered = false,
  onClear,
  clearLabel = "Tampilkan semua",
  icon: Icon,
  variant = "page",
  action,
  className
}: EmptyStateProps) {
  
  // Decide icon based on variant & filters
  // Decide icon based on variant & filters
  let FinalIcon = Icon
  if (!FinalIcon) {
    if (variant === "error") {
      FinalIcon = AlertCircle
    } else if (variant === "search" || isFiltered) {
      FinalIcon = SearchX
    } else {
      FinalIcon = Database
    }
  }

  // Decide titles/descriptions
  const defaultTitle = () => {
    if (variant === "error") return "Terjadi Kesalahan"
    if (variant === "search" || isFiltered) return "Tidak ada hasil pencarian"
    return "Belum ada data"
  }
  
  const defaultDesc = () => {
    if (variant === "error") return "Gagal memuat data dari server. Silakan coba kembali."
    if (variant === "search" || isFiltered) return "Coba ubah kata kunci atau hapus filter pencarian Anda."
    return "Data belum tersedia dalam sistem. Tambahkan entri baru untuk memulai."
  }

  const iconBgClasses = cn(
    "rounded-2xl flex items-center justify-center mb-5",
    variant === "error"
      ? "bg-danger-50 dark:bg-danger-950/20"
      : "bg-zinc-100 dark:bg-zinc-800/60",
    {
      "w-16 h-16": variant !== "card",
      "w-12 h-12 mb-4": variant === "card"
    }
  )

  const iconClasses = cn(
    variant === "error"
      ? "text-danger-500"
      : "text-zinc-400 dark:text-zinc-500",
    {
      "w-8 h-8": variant !== "card",
      "w-6 h-6": variant === "card"
    }
  )

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        motion.fast,
        {
          "py-16 px-6": variant === "page" || variant === "table",
          "py-12 px-4": variant === "dashboard",
          "py-8 px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-900/10": variant === "card",
          "py-12 px-6": variant === "search" || variant === "error",
        },
        className
      )}
    >
      <div className={iconBgClasses}>
        <FinalIcon className={iconClasses} />
      </div>
      <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
        {title ?? defaultTitle()}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed mb-6">
        {description ?? defaultDesc()}
      </p>
      
      {/* Custom Action or Default Clear Filters Action */}
      {action ? (
        <div className="flex items-center gap-3">{action}</div>
      ) : (
        isFiltered && onClear && (
          <Button onClick={onClear} variant="outline" size="sm">
            {clearLabel}
          </Button>
        )
      )}
    </div>
  )

  if (variant === "table") {
    return (
      <tr>
        <td colSpan={999}>
          {content}
        </td>
      </tr>
    )
  }

  return content
}
