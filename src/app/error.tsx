"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed in the future
    console.error("Application Error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-danger-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Card */}
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 text-center shadow-xl shadow-zinc-200/20 dark:shadow-black/40">
          
          <div className="w-20 h-20 mx-auto bg-danger-500/10 dark:bg-danger-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-danger-600 dark:text-danger-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
            Terjadi Kesalahan
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Maaf, sistem mengalami masalah saat memproses permintaan Anda. Silakan coba muat ulang halaman.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
              aria-label="Coba Lagi"
            >
              <RotateCcw className="w-4 h-4" />
              Coba Lagi
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white shadow-lg shadow-primary-500/20 transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              aria-label="Kembali ke Dashboard"
            >
              <Home className="w-4 h-4" />
              Ke Dashboard
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  )
}
