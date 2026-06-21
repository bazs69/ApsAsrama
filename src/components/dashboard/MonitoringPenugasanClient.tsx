"use client"

import {
  Users,
  Building2,
  UserSquare2,
  ClipboardList,
  AlertTriangle,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Minus
} from "lucide-react"
import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import DetailSantriModal from "./laporan/DetailSantriModal"

export default function MonitoringPenugasanClient({ user, satkerList, initialData }: {
  user: { satkerId?: string | null, permissions?: string[] } | null
  satkerList?: { id: string, name: string }[]
  initialData?: {
    bulan?: number
    tahun?: number
    satkerIdFilter?: string
    statusFilter?: string
    monitoringData?: Record<string, string | number>[]
    rekapData?: Record<string, string | number>[]
    dashboardStats?: {
      totalSantriKIP: number
      totalSatker: number
      totalKepalaSatker: number
      laporanBulanIni: number
      belumMelapor: number
    }
  }
}) {
  // Show simplified view if user has a satkerId but no broad satker.view permission
  const isKepalaSatker = !!user?.satkerId && !user?.permissions?.includes("satker.view")
  
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [bulan, setBulan] = useState(initialData?.bulan || new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(initialData?.tahun || new Date().getFullYear())
  const [satkerFilter, setSatkerFilter] = useState(initialData?.satkerIdFilter || "")
  const [statusFilter, setStatusFilter] = useState(initialData?.statusFilter || "ALL")
  const [detailResidentId, setDetailResidentId] = useState<string | null>(null)

  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("bulan", bulan.toString())
    params.set("tahun", tahun.toString())
    if (satkerFilter) params.set("satker", satkerFilter)
    else params.delete("satker")
    if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
    else params.delete("status")
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleResetFilter = () => {
    const now = new Date()
    setBulan(now.getMonth() + 1)
    setTahun(now.getFullYear())
    setSatkerFilter("")
    setStatusFilter("ALL")
    router.push(pathname)
  }

  const monitoringData = initialData?.monitoringData || []
  const rekapData = initialData?.rekapData || []
  const stats = initialData?.dashboardStats || {
    totalSantriKIP: 0, totalSatker: 0, totalKepalaSatker: 0, laporanBulanIni: 0, belumMelapor: 0
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sangat Aktif":
        return "bg-emerald-100 text-emerald-700"
      case "Aktif":
        return "bg-emerald-100 text-emerald-700"
      case "Cukup Aktif":
        return "bg-orange-100 text-orange-700"
      case "Kurang Aktif":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Calculate chart data from monitoringData
  const totalMonitorings = monitoringData.length
  let sangatAktif = 0, aktif = 0, cukupAktif = 0, kurangAktif = 0

  monitoringData.forEach((m: Record<string, string | number>) => {
    if (m.status === "Sangat Aktif") sangatAktif++
    else if (m.status === "Aktif") aktif++
    else if (m.status === "Cukup Aktif") cukupAktif++
    else if (m.status === "Kurang Aktif") kurangAktif++
  })

  const getPct = (val: number) => totalMonitorings > 0 ? val / totalMonitorings : 0
  
  // Circumference for strokeDasharray
  const C = 251.2
  
  // Offsets
  const offsetSangatAktif = C * (1 - getPct(sangatAktif))
  const rotAktif = -90 + (getPct(sangatAktif) * 360)
  const offsetAktif = C * (1 - getPct(aktif))
  const rotCukup = rotAktif + (getPct(aktif) * 360)
  const offsetCukup = C * (1 - getPct(cukupAktif))
  const rotKurang = rotCukup + (getPct(cukupAktif) * 360)
  const offsetKurang = C * (1 - getPct(kurangAktif))

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      {!isKepalaSatker && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Total Santri KIP */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Santri KIP</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.totalSantriKIP}</span>
                <span className="text-sm font-medium text-slate-500">Orang</span>
              </div>
            </div>
          </div>

          {/* Total Satker */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Satker</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.totalSatker}</span>
                <span className="text-sm font-medium text-slate-500">Satker</span>
              </div>
            </div>
          </div>

          {/* Total Kepala Satker */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
              <UserSquare2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Total Kepala Satker</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.totalKepalaSatker}</span>
                <span className="text-sm font-medium text-slate-500">Orang</span>
              </div>
            </div>
          </div>

          {/* Laporan Bulan Ini */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Laporan Bulan Ini</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.laporanBulanIni} / {stats.totalSatker}</span>
                <span className="text-sm font-medium text-slate-500">Satker</span>
              </div>
            </div>
          </div>

          {/* Belum Melapor */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Belum Melapor</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-800">{stats.belumMelapor}</span>
                <span className="text-sm font-medium text-slate-500">Satker</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 border-b border-slate-200 pb-6">
        <div className="flex-1 min-w-[200px] max-w-[250px]">
          <label className="block text-sm font-semibold text-slate-600 mb-2">Bulan</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={bulan}
              onChange={(e) => setBulan(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] max-w-[250px]">
          <label className="block text-sm font-semibold text-slate-600 mb-2">Tahun</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {!isKepalaSatker && (
          <div className="flex-1 min-w-[200px] max-w-[250px]">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Satker</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={satkerFilter}
                onChange={(e) => setSatkerFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Satker</option>
                {satkerList?.map((s: { id: string, name: string }) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-[200px] max-w-[250px]">
          <label className="block text-sm font-semibold text-slate-600 mb-2">Status Laporan</label>
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="Sangat Aktif">Sangat Aktif</option>
              <option value="Aktif">Aktif</option>
              <option value="Cukup Aktif">Cukup Aktif</option>
              <option value="Kurang Aktif">Kurang Aktif</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleApplyFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Search className="w-4 h-4" />
            Tampilkan
          </button>
          <button 
            onClick={handleResetFilter}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid grid-cols-1 gap-6 ${isKepalaSatker ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
        
        {/* Left Column - Data Monitoring */}
        <div className={`${isKepalaSatker ? '' : 'lg:col-span-2'} space-y-4`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Data Monitoring Penugasan</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                    <th className="py-4 px-5 text-center">No</th>
                    <th className="py-4 px-5">Nama Santri</th>
                    <th className="py-4 px-5">Satker</th>
                    <th className="py-4 px-5">Kepala Satker</th>
                    <th className="py-4 px-5 text-center">Status Keaktifan</th>
                    <th className="py-4 px-5 text-center">Periode</th>
                    <th className="py-4 px-5 text-center">Tanggal Lapor</th>
                    <th className="py-4 px-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {monitoringData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">Tidak ada data.</td>
                    </tr>
                  ) : (
                    monitoringData.map((row: Record<string, string | number | undefined>) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-5 text-center text-slate-600 font-medium">{row.no}</td>
                        <td className="py-3 px-5">
                          <div className="font-semibold text-slate-800">{row.name}</div>
                          <div className="text-xs text-slate-500">{row.nim}</div>
                        </td>
                        <td className="py-3 px-5 text-slate-600">{row.satker}</td>
                        <td className="py-3 px-5 text-slate-600">{row.kepala}</td>
                        <td className="py-3 px-5 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(row.status as string)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center text-slate-600">{row.periode}</td>
                        <td className="py-3 px-5 text-center text-slate-600">{row.tanggal}</td>
                        <td className="py-3 px-5 text-center">
                          <button 
                            onClick={() => setDetailResidentId(row.residentId as string)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-slate-500 font-medium">
                Menampilkan {monitoringData.length} data
              </div>
            </div>
          </div>
          
          {/* Info Banner */}
          <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3 border border-blue-100">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-sm text-blue-800 font-medium">
              Klik tombol &quot;Lihat Detail&quot; untuk melihat detail penilaian setiap santri pada satker terkait.
            </p>
          </div>
        </div>

        {/* Right Column - Rekap & Chart */}
        {!isKepalaSatker && (
          <div className="space-y-6">
            {/* Rekap Laporan Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Rekap Laporan Per Satker ({new Date(0, bulan - 1).toLocaleString('id-ID', { month: 'long' })} {tahun})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4 text-center">No</th>
                    <th className="py-3 px-4">Satker</th>
                    <th className="py-3 px-4 text-center">Jumlah Anggota</th>
                    <th className="py-3 px-4 text-center">Sudah Lapor</th>
                    <th className="py-3 px-4 text-center">Belum Lapor</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rekapData.map((row: Record<string, string | number | boolean | undefined>) => (
                    <tr key={String(row.no)} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">{row.no}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{row.satker}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{row.jumlah}</td>
                      <td className="py-3 px-4 text-center">
                        {row.sudah ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.belum ? (
                          <span className="text-red-500 font-bold">{row.belum}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Persentase Keaktifan Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-6">Persentase Keaktifan (Semua Satker)</h3>
            
            <div className="flex flex-col xl:flex-row items-center gap-6">
              {/* Donut Chart (SVG) */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                  
                  {totalMonitorings > 0 && (
                    <>
                      {/* Segment: Sangat Aktif - Green */}
                      {sangatAktif > 0 && (
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="15" 
                          strokeDasharray={C} strokeDashoffset={offsetSangatAktif} />
                      )}
                      
                      {/* Segment: Aktif - Teal */}
                      {aktif > 0 && (
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#34d399" strokeWidth="15" 
                          strokeDasharray={C} strokeDashoffset={offsetAktif} 
                          transform={`rotate(${rotAktif} 50 50)`} />
                      )}
                      
                      {/* Segment: Cukup Aktif - Orange */}
                      {cukupAktif > 0 && (
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="15" 
                          strokeDasharray={C} strokeDashoffset={offsetCukup} 
                          transform={`rotate(${rotCukup} 50 50)`} />
                      )}
                      
                      {/* Segment: Kurang Aktif - Red */}
                      {kurangAktif > 0 && (
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="15" 
                          strokeDasharray={C} strokeDashoffset={offsetKurang} 
                          transform={`rotate(${rotKurang} 50 50)`} />
                      )}
                    </>
                  )}
                </svg>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-1">
                  <span className="text-2xl font-black text-slate-800 leading-none">{totalMonitorings}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">Data</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="font-semibold text-slate-700">Sangat Aktif</span>
                  </div>
                  <div className="font-bold text-slate-800 text-right">
                    {sangatAktif} <span className="text-slate-500 font-medium">({(getPct(sangatAktif) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    <span className="font-semibold text-slate-700">Aktif</span>
                  </div>
                  <div className="font-bold text-slate-800 text-right">
                    {aktif} <span className="text-slate-500 font-medium">({(getPct(aktif) * 100).toFixed(1)}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="font-semibold text-slate-700">Cukup Aktif</span>
                  </div>
                  <div className="font-bold text-slate-800 text-right">
                    {cukupAktif} <span className="text-slate-500 font-medium">({(getPct(cukupAktif) * 100).toFixed(1)}%)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-semibold text-slate-700">Kurang Aktif</span>
                  </div>
                  <div className="font-bold text-slate-800 text-right">
                    {kurangAktif} <span className="text-slate-500 font-medium">({(getPct(kurangAktif) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DetailSantriModal 
        isOpen={!!detailResidentId} 
        onClose={() => setDetailResidentId(null)} 
        residentId={detailResidentId!} 
      />
    </div>
  )
}
