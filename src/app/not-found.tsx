"use client"

import Link from "next/link"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-zinc-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Card */}
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 text-center shadow-xl shadow-zinc-200/20 dark:shadow-black/40">
          
          <div className="w-20 h-20 mx-auto bg-primary-500/10 dark:bg-primary-500/20 rounded-full flex items-center justify-center mb-6">
            <FileQuestion className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan. Silakan periksa kembali tautan yang Anda masukkan.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-500/40"
              aria-label="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
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
