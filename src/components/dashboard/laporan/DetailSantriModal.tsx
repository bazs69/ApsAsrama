"use client"

import React, { useEffect, useState } from "react"
import { X, User, Briefcase, Activity, Calendar, TrendingUp } from "lucide-react"
import { getSantriDetailForLaporan } from "@/app/actions/laporan"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type DetailSantriData = {
  profil: {
    nama: string
    nim: string
    daerah: string
    status: string
    wilayah: string
    prodi: string
  }
  penugasan: {
    id: string
    satker: string
    posisi: string
    tanggalMulai: Date | string
    status: string
  }[]
  monitoring: {
    id: string
    tanggal: Date | string
    satker: string
    status: string
    catatan: string
  }[]
}

export default function DetailSantriModal({ 
  isOpen, 
  onClose, 
  residentId 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  residentId: string | null 
}) {
  const [data, setData] = useState<DetailSantriData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    if (isOpen && residentId) {
      const fetchData = async () => {
        setLoading(true)
        const res = await getSantriDetailForLaporan(residentId)
        if (active) {
          setData(res as unknown as DetailSantriData)
          setLoading(false)
        }
      }
      fetchData()
    } else {
      setTimeout(() => setData(null), 0)
    }
    return () => { active = false }
  }, [isOpen, residentId])

  if (!isOpen) return null

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Sangat Aktif": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "Aktif": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "Cukup Aktif": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "Kurang Aktif": return "bg-red-500/10 text-red-600 border-red-500/20"
      case "ACTIVE": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "COMPLETED": return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      default: return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
    }
  }

  const getScore = (status: string) => {
    switch (status) {
      case "Sangat Aktif": return 4
      case "Aktif": return 3
      case "Cukup Aktif": return 2
      case "Kurang Aktif": return 1
      default: return 0
    }
  }

  const chartData = data?.monitoring 
    ? [...data.monitoring].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()).map(m => ({
        name: new Date(m.tanggal).toLocaleString('id-ID', { month: 'short', year: '2-digit' }),
        score: getScore(m.status),
        status: m.status
      }))
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight">Detail Santri</h2>
              <p className="text-xs text-zinc-500 font-medium">Informasi Profil & Rekam Jejak Penugasan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-zinc-500 font-medium text-sm">Memuat data santri...</p>
            </div>
          ) : !data ? (
            <div className="py-20 text-center text-zinc-500">Data tidak ditemukan.</div>
          ) : (
            <div className="space-y-8">
              
              {/* Profil Singkat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profil
                  </h3>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div>
                      <p className="text-xs text-zinc-500 font-medium mb-1">Nama Lengkap</p>
                      <p className="font-bold text-zinc-900 dark:text-white text-lg">{data.profil.nama}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 font-medium mb-1">NIS/NIM</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{data.profil.nim}</p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Daerah</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{data.profil.daerah || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 font-medium mb-1">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${data.profil.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                          {data.profil.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Penempatan
                  </h3>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 h-[calc(100%-2rem)]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 font-medium mb-1">Wilayah</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{data.profil.wilayah || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 font-medium mb-1">Program Studi</p>
                        <p className="font-semibold text-zinc-900 dark:text-white">{data.profil.prodi}</p>
                      </div>
                    </div>
                    {data.penugasan.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-zinc-500 font-medium mb-2">Satker Aktif Terakhir</p>
                        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white text-sm">{data.penugasan[0].satker}</p>
                            <p className="text-xs text-zinc-500">{data.penugasan[0].posisi}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Riwayat Penugasan */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Riwayat Penugasan
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium">
                      <tr>
                        <th className="px-4 py-3">Satker</th>
                        <th className="px-4 py-3">Posisi</th>
                        <th className="px-4 py-3">Tanggal Mulai</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {data.penugasan.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-500">Belum ada riwayat penugasan.</td></tr>
                      ) : (
                        data.penugasan.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">{p.satker}</td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{p.posisi}</td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{new Date(p.tanggalMulai).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(p.status)} uppercase`}>
                                {p.status === 'ACTIVE' ? 'Aktif' : 'Selesai'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grafik Perkembangan */}
              {chartData.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Grafik Perkembangan Keaktifan
                  </h3>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 p-6">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#52525b" opacity={0.2} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#71717a' }} 
                            dy={10}
                          />
                          <YAxis 
                            domain={[0, 4]} 
                            ticks={[1, 2, 3, 4]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 12, fill: '#71717a' }}
                            tickFormatter={(value) => {
                              if (value === 4) return "Sangat Aktif"
                              if (value === 3) return "Aktif"
                              if (value === 2) return "Cukup Aktif"
                              if (value === 1) return "Kurang Aktif"
                              return ""
                            }}
                            width={80}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={((value: number, name: string, props: { payload: { status: string } }) => [props.payload.status, "Status"]) as unknown as React.ComponentProps<typeof Tooltip>["formatter"]}
                            labelStyle={{ color: '#71717a', fontWeight: 600, marginBottom: '4px' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#059669" 
                            strokeWidth={3} 
                            dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: '#059669' }} 
                            activeDot={{ r: 7, strokeWidth: 0, fill: '#059669' }}
                            animationDuration={1000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Riwayat Monitoring */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Riwayat Monitoring Bulanan
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium">
                      <tr>
                        <th className="px-4 py-3 w-32">Bulan/Tahun</th>
                        <th className="px-4 py-3">Satker</th>
                        <th className="px-4 py-3 w-32">Status Keaktifan</th>
                        <th className="px-4 py-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {data.monitoring.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-zinc-500">Belum ada riwayat monitoring.</td></tr>
                      ) : (
                        data.monitoring.map((m) => (
                          <tr key={m.id} className="align-top">
                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white whitespace-nowrap">
                              {new Date(m.tanggal).toLocaleString('id-ID', { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{m.satker}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold border ${getStatusBadge(m.status)} uppercase`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                              {m.catatan || "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
