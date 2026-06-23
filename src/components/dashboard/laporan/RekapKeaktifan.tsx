"use client"

import { Search, Award, AlertTriangle, Users } from "lucide-react"
import { useState } from "react"

export default function RekapKeaktifan({ data, onOpenDetail }: { 
  data: {
    id: string
    namaSantri: string
    nim: string | null
    satker: string
    rataRata: string
    score: number
    status: string
    totalMonitoring: number
  }[], 
  onOpenDetail: (id: string) => void 
}) {
  const [search, setSearch] = useState("")

  const filteredData = data?.filter(item => 
    item.namaSantri.toLowerCase().includes(search.toLowerCase()) ||
    item.satker.toLowerCase().includes(search.toLowerCase())
  )

  const top10Active = [...(data || [])].sort((a, b) => b.score - a.score).slice(0, 10).filter(d => d.score >= 3.0)
  const top10NeedGuidance = [...(data || [])].sort((a, b) => a.score - b.score).slice(0, 10).filter(d => d.score > 0 && d.score < 2.5)

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Sangat Aktif": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      case "Aktif": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
      case "Cukup Aktif": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      case "Kurang Aktif": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      default: return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top 10 Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block">
        
        {/* Top 10 Teraktif */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm print:mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Top 10 Santri Teraktif</h3>
          </div>
          <div className="space-y-3">
            {top10Active.length === 0 ? <p className="text-zinc-500 text-sm">Belum ada data.</p> : top10Active.map((santri, idx) => (
              <div key={santri.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">{santri.namaSantri}</p>
                    <p className="text-xs text-zinc-500">{santri.satker}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{santri.rataRata}</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">Skor Rata-Rata</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Perlu Pembinaan */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Perlu Pembinaan (Skor Terendah)</h3>
          </div>
          <div className="space-y-3">
            {top10NeedGuidance.length === 0 ? <p className="text-zinc-500 text-sm">Tidak ada santri yang memerlukan pembinaan.</p> : top10NeedGuidance.map((santri, idx) => (
              <div key={santri.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-white text-sm">{santri.namaSantri}</p>
                    <p className="text-xs text-zinc-500">{santri.satker}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600 dark:text-red-400 text-sm">{santri.rataRata}</p>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-400">Skor Rata-Rata</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Full Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Rekapitulasi Keaktifan Keseluruhan</h2>
          
          <div className="relative w-full md:w-72 print:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Cari santri, satker..." 
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
                <th className="px-5 py-4 font-semibold">Peringkat</th>
                <th className="px-5 py-4 font-semibold">Nama Santri</th>
                <th className="px-5 py-4 font-semibold">Satker</th>
                <th className="px-5 py-4 font-semibold">Total Dimonitor</th>
                <th className="px-5 py-4 font-semibold">Skor Rata-Rata</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredData?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-zinc-500 font-medium text-base">Belum ada data rekap keaktifan santri.</p>
                      <p className="text-zinc-400 text-sm mt-1">Pastikan sudah ada data monitoring penugasan yang dinilai.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData?.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-bold">#{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-white text-left">
                        {row.namaSantri}
                      </div>
                      <div className="text-xs text-zinc-500">{row.nim || "-"}</div>
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{row.satker}</td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{row.totalMonitoring} kali</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-zinc-900 dark:text-white text-base">{row.rataRata}</span>
                      <span className="text-zinc-400 text-xs ml-1">/ 4.00</span>
                    </td>
                    <td className="px-5 py-4">
                      {row.score > 0 ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(row.status)}`}>
                          {row.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                          Belum Dinilai
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => onOpenDetail(row.id)}
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

    </div>
  )
}
