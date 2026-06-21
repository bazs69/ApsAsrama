"use client"

import { CheckCircle, Clock } from "lucide-react"

export default function RiwayatLaporanKepalaSatker({ data }: { data: { id: string, bulan: number, tahun: number, jumlahDinilai: number, status: string, createdAt: Date | string }[] }) {
  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ]

  const getStatusBadge = (status: string) => {
    if (status === "SUBMITTED") {
      return (
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Terkirim</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold">
        <Clock className="w-3.5 h-3.5" />
        <span>Draft</span>
      </span>
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Riwayat Laporan Bulanan</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-4 font-semibold">No</th>
              <th className="px-5 py-4 font-semibold">Periode</th>
              <th className="px-5 py-4 font-semibold text-center">Jumlah Anggota Dinilai</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Tanggal Diperbarui</th>
              <th className="px-5 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">Belum ada riwayat laporan.</td>
              </tr>
            ) : (
              data?.map((row, idx) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{idx + 1}</td>
                  <td className="px-5 py-4 text-zinc-900 dark:text-white font-medium text-base">
                    {MONTH_NAMES[row.bulan - 1]} {row.tahun}
                  </td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-medium text-center">
                    <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">
                      {row.jumlahDinilai} Santri
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(row.status)}
                  </td>
                  <td className="px-5 py-4 text-zinc-500 text-xs">
                    {new Date(row.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} WIB
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <a 
                        href={`/dashboard/monitoring-penugasan`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Lihat Detail
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
