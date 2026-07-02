"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    console.error("Global Application Error:", error)
  }, [error])

  return (
    <html lang="id">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
          <div className="relative z-10 w-full max-w-lg">
            <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 text-center shadow-xl shadow-zinc-200/20 dark:shadow-black/40">
              <div className="w-20 h-20 mx-auto bg-danger-500/10 dark:bg-danger-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-danger-600 dark:text-danger-400" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                Fatal Error
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                Terjadi kesalahan sistem yang tidak terduga. Silakan muat ulang seluruh aplikasi.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-danger-600 hover:bg-danger-500 text-white shadow-lg shadow-danger-500/20 transition-all font-semibold focus:outline-none focus:ring-2 focus:ring-danger-500/40"
                  aria-label="Coba Lagi"
                >
                  <RotateCcw className="w-4 h-4" />
                  Muat Ulang Aplikasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
