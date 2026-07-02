"use client"

import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from "lucide-react"
import { generatePageNumbers } from "@/lib/utils/pagination"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  /** Entity name shown in footer, e.g. "Pengguna", "Santri", "Laporan" */
  entityName?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  entityName = "Data",
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)
  const pageItems = generatePageNumbers(currentPage, totalPages)
  const navRef = useRef<HTMLDivElement>(null)

  // ── Keyboard Navigation ──────────────────────────────────────────────────
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when focus is inside the nav
      if (!nav.contains(document.activeElement)) return
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" ||
          e.key === "Home" || e.key === "End") {
        e.preventDefault()
      }
      if (e.key === "ArrowLeft" && currentPage > 1) onPageChange(currentPage - 1)
      if (e.key === "ArrowRight" && currentPage < totalPages) onPageChange(currentPage + 1)
      if (e.key === "Home") onPageChange(1)
      if (e.key === "End" && totalPages > 0) onPageChange(totalPages)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, totalPages, onPageChange])

  const btnBase =
    "flex items-center justify-center min-w-[2rem] h-8 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40"
  const btnGhost =
    `${btnBase} text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed`
  const btnActive =
    `${btnBase} bg-primary-600 text-white shadow-sm shadow-primary-500/20 cursor-default`
  const btnNumber =
    `${btnBase} text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 px-2`

  return (
    <div
      className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/20"
      aria-label="Navigasi halaman"
    >
      {/* ── Left: Rows-per-page + footer info ── */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <label htmlFor="pagination-page-size" className="whitespace-nowrap">
            Tampilkan
          </label>
          <select
            id="pagination-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 cursor-pointer text-zinc-700 dark:text-zinc-300"
            aria-label="Pilih jumlah baris per halaman"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>baris</span>
        </div>

        {totalItems > 0 ? (
          <span>
            Menampilkan{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              {startItem}–{endItem}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalItems}</span>{" "}
            {entityName}
          </span>
        ) : (
          <span>0 {entityName} ditemukan</span>
        )}
      </div>

      {/* ── Right: Navigation ── */}
      <div ref={navRef} className="flex items-center gap-2" role="navigation" aria-label="Halaman">
        {/* Page X/Y indicator — desktop only */}
        <span className="text-sm text-zinc-400 dark:text-zinc-500 whitespace-nowrap hidden md:inline">
          Hal {currentPage} dari {Math.max(1, totalPages)}
        </span>

        {/* ── Mobile: simplified Prev / Page X of Y / Next ── */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={btnGhost}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs ml-1">Prev</span>
          </button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            {currentPage} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className={btnGhost}
            aria-label="Halaman selanjutnya"
          >
            <span className="text-xs mr-1">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Desktop: full page controls ── */}
        <div className="hidden md:flex items-center gap-1">
          {/* First */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className={btnGhost}
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Prev */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={btnGhost}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Smart page numbers */}
          <div className="flex items-center gap-1">
            {pageItems.map((item, idx) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex items-center justify-center min-w-[2rem] h-8 text-zinc-400 dark:text-zinc-600"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => onPageChange(item)}
                  className={item === currentPage ? btnActive : btnNumber}
                  aria-label={`Halaman ${item}`}
                  aria-current={item === currentPage ? "page" : undefined}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          {/* Next */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className={btnGhost}
            aria-label="Halaman selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages || totalPages === 0}
            className={btnGhost}
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
