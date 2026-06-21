import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Akses Ditolak | SPThree Connect",
}

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Akses Ditolak</h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        Maaf, Anda tidak memiliki izin untuk mengakses halaman ini. Silakan hubungi Super Admin jika Anda merasa ini adalah sebuah kesalahan.
      </p>
      <Link 
        href="/dashboard"
        className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all shadow-sm"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
