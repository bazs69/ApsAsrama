"use client"

import { Search, FileText } from "lucide-react"
import { useState } from "react"

export default function LaporanPenugasan({ data, onOpenDetail }: { 
  data: {
    id: string
    residentId: string
    namaSantri: string
    nim: string | null
    satker: string
    tanggalMulai: Date | string
    status: string
  }[], 
  onOpenDetail: (id: string) => void 
}) {
  const [search, setSearch] = useState("")

  const filteredData = data?.filter(item => 
    item.namaSantri.toLowerCase().includes(search.toLowerCase()) ||
    item.satker.toLowerCase().includes(search.toLowerCase()) ||
    (item.nim || "").toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ACTIVE": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      case "COMPLETED": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      default: return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
    }
  }

  const formatStatus = (status: string) => {
    if (status === "ACTIVE") return "Aktif"
    if (status === "COMPLETED") return "Selesai"
    return status
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Data Penugasan Santri</h2>
        </div>
        
        <div className="relative w-full md:w-72 print:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Cari santri, NIM, satker..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-4 font-semibold">No</th>
              <th className="px-5 py-4 font-semibold">Nama Santri</th>
              <th className="px-5 py-4 font-semibold">Satker</th>
              <th className="px-5 py-4 font-semibold">Tanggal Mulai</th>
              <th className="px-5 py-4 font-semibold">Status Penugasan</th>
              <th className="px-5 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredData?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <p className="text-zinc-500 font-medium text-base">Belum ada data penugasan yang tersedia.</p>
                    <p className="text-zinc-400 text-sm mt-1">Silakan pilih periode atau satker lain.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData?.map((row, idx) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-zinc-900 dark:text-white text-left">
                      {row.namaSantri}
                    </div>
                    <div className="text-xs text-zinc-500">{row.nim || "-"}</div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{row.satker}</td>
                  <td className="px-5 py-4 text-zinc-900 dark:text-white font-medium">{new Date(row.tanggalMulai).toLocaleDateString('id-ID')}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(row.status)}`}>
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button 
                      onClick={() => onOpenDetail(row.residentId)}
                      className="inline-flex items-center justify-center px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:hover:bg-primary-500/20 dark:text-primary-400 rounded-lg text-xs font-bold transition-colors border border-primary-200 dark:border-primary-500/20"
                    >
                      Lihat Detail
                    </button>
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
