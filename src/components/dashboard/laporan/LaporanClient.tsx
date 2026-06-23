"use client"

import React, { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { 
  LayoutDashboard, 
  ClipboardList, 
  
  
  FileText,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Activity,
  Users
} from "lucide-react"
import DashboardLaporan from "./DashboardLaporan"
import LaporanPenugasan from "./LaporanPenugasan"
import RekapKeaktifan from "./RekapKeaktifan"
import LaporanMonitoring from "./LaporanMonitoring"
import RiwayatLaporanKepalaSatker from "../kepala-satker/RiwayatLaporanKepalaSatker"
import RiwayatExport from "./RiwayatExport"
import DetailSantriModal from "./DetailSantriModal"
import * as XLSX from "xlsx"
import { logExportAction } from "@/app/actions/laporan"



export interface DashboardData {
  totalSantriDitugaskan: number;
  totalSatkerAktif: number;
  totalMonitoringBulanIni: number;
  tingkatKeaktifan: string | number;
  trendData?: { name: string; jumlah: number }[];
  distribusiData?: { name: string; value: number }[];
}

export interface RekapData {
  namaSantri: string;
  nim: string | null;
  satker: string;
  rataRata: number;
  status: string;
}

export interface MonitoringData {
  tanggal: string;
  namaSantri: string;
  satker: string;
  status: string;
  catatan: string;
}

export interface PenugasanData {
  tanggalMulai: string;
  namaSantri: string;
  nim: string | null;
  satker: string;
  status: string;
}

export interface Satker {
  id: string;
  name: string;
}

export interface LaporanClientProps {
  initialTab: string;
  bulan: number;
  tahun: number;
  satkerId: string;
  status: string;
  satkerList: Satker[];
  dashboardData: DashboardData | null;
  rekapData: RekapData[];
  monitoringData: MonitoringData[];
  riwayatLaporanSatkerData: unknown[];
  exportHistoryData: unknown[];
  penugasanData: PenugasanData[];
  userRole: string;
}

export default function LaporanClient({ 
  initialTab, 
  bulan, 
  tahun, 
  satkerId, 
  status,
  satkerList,
  dashboardData,
  rekapData,
  monitoringData,
  riwayatLaporanSatkerData,
  exportHistoryData,
  penugasanData,
  userRole 
}: LaporanClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const TABS = userRole === "KEPALA_SATKER" 
    ? [
        { id: "monitoring", label: "Riwayat Laporan", icon: Activity },
        { id: "export", label: "Riwayat Export", icon: FileText },
      ]
    : [
        { id: "dashboard", label: "Dashboard Laporan", icon: LayoutDashboard },
        { id: "penugasan", label: "Laporan Penugasan", icon: ClipboardList },
        { id: "monitoring", label: "Laporan Monitoring", icon: Activity },
        { id: "keaktifan", label: "Rekap Keaktifan", icon: Users },
        { id: "export", label: "Riwayat Export", icon: FileText },
      ]

  const defaultTab = userRole === "KEPALA_SATKER" ? (initialTab === "dashboard" ? "monitoring" : initialTab) : initialTab
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [filterBulan, setFilterBulan] = useState(bulan)
  const [filterTahun, setFilterTahun] = useState(tahun)
  const [filterSatker, setFilterSatker] = useState(satkerId)
  const [filterStatus, setFilterStatus] = useState(status)

  const [selectedSantriId, setSelectedSantriId] = useState<string | null>(null)

  // Update URL on tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tabId)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("bulan", filterBulan.toString())
    params.set("tahun", filterTahun.toString())
    if (filterSatker) params.set("satker", filterSatker)
    else params.delete("satker")
    if (filterStatus && filterStatus !== "ALL") params.set("status", filterStatus)
    else params.delete("status")
    
    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    const now = new Date()
    setFilterBulan(now.getMonth() + 1)
    setFilterTahun(now.getFullYear())
    setFilterSatker("")
    setFilterStatus("ALL")
    
    const params = new URLSearchParams()
    params.set("tab", activeTab)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleExportExcel = async () => {
    let dataToExport: Record<string, string | number>[] = []
    const fileName = `Laporan_${activeTab}_${filterBulan}_${filterTahun}.xlsx`
    let reportName = activeTab.toUpperCase()

    if (activeTab === "keaktifan") {
      dataToExport = rekapData.map((d, i) => ({
        "No": i + 1,
        "Nama Santri": d.namaSantri,
        "NIS/NIM": d.nim || "-",
        "Satker": d.satker,
        "Rata-Rata Keaktifan": d.rataRata,
        "Status": d.status
      }))
      reportName = "Rekap Keaktifan"
    } else if (activeTab === "monitoring") {
      dataToExport = monitoringData.map((d, i) => ({
        "No": i + 1,
        "Tanggal": new Date(d.tanggal).toLocaleDateString('id-ID'),
        "Nama Santri": d.namaSantri,
        "Satker": d.satker,
        "Status": d.status,
        "Catatan": d.catatan
      }))
      reportName = "Laporan Monitoring"
    } else if (activeTab === "penugasan") {
      dataToExport = penugasanData.map((d, i) => ({
        "No": i + 1,
        "Tanggal Mulai": new Date(d.tanggalMulai).toLocaleDateString('id-ID'),
        "Nama Santri": d.namaSantri,
        "NIS/NIM": d.nim || "-",
        "Satker": d.satker,
        "Status": d.status
      }))
      reportName = "Laporan Penugasan"
    } else {
      alert("Tab ini tidak mendukung export Excel secara langsung.")
      return
    }

    if (dataToExport.length === 0) {
      alert("Tidak ada data untuk diexport.")
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")
    XLSX.writeFile(workbook, fileName)

    await logExportAction(fileName, reportName)
  }

  const handleExportPDF = async () => {
    const fileName = `Laporan_${activeTab}_${filterBulan}_${filterTahun}.pdf`
    const reportName = activeTab.toUpperCase() + " (PDF)"
    
    // The print function relies on CSS media queries (@media print) to format the page
    window.print()
    await logExportAction(fileName, reportName)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white print:text-black">
            Laporan & Analitik
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 print:hidden mt-1">
            Pusat evaluasi dan rekapitulasi data SPThree Connect.
          </p>
        </div>
        
        <div className="flex items-center gap-3 print:hidden">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all text-sm shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-all text-sm shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Global Stat Cards */}
      {dashboardData && userRole !== "KEPALA_SATKER" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Total Santri Ditugaskan</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{dashboardData.totalSantriDitugaskan}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Total Satker Aktif</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{dashboardData.totalSatkerAktif}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Monitoring Bulan Ini</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{dashboardData.totalMonitoringBulanIni}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tingkat Keaktifan</p>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{dashboardData.tingkatKeaktifan}%</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center overflow-x-auto no-scrollbar gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 print:hidden">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-primary-600 dark:text-primary-400 shadow-sm border border-zinc-200 dark:border-zinc-700"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : ""}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Global Filter */}
      {activeTab !== "export" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <h2 className="font-bold text-zinc-900 dark:text-white text-sm uppercase tracking-wider">Filter Laporan</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Bulan</label>
              <select 
                value={filterBulan} 
                onChange={(e) => setFilterBulan(parseInt(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Tahun</label>
              <select 
                value={filterTahun} 
                onChange={(e) => setFilterTahun(parseInt(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {userRole !== "KEPALA_SATKER" && (
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Satker</label>
                <select 
                  value={filterSatker} 
                  onChange={(e) => setFilterSatker(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                >
                  <option value="">Semua Satker</option>
                  {satkerList?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === "monitoring" && (
              <div>
                <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Status</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Sangat Aktif">Sangat Aktif</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Cukup Aktif">Cukup Aktif</option>
                  <option value="Kurang Aktif">Kurang Aktif</option>
                </select>
              </div>
            )}

            <div className={`flex items-end gap-2 ${activeTab === "monitoring" ? 'md:col-span-4 justify-end' : ''}`}>
              <button 
                onClick={resetFilters}
                className="p-2.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent"
                title="Reset Filter"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={applyFilters}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-primary-500/20 transition-all"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Active Tab Component */}
      <div className="print:mt-0">
        <div className="hidden print:block mb-8 text-center border-b pb-4">
          <h2 className="text-2xl font-bold uppercase">{TABS.find(t => t.id === activeTab)?.label}</h2>
          <p className="text-sm">Periode: {new Date(0, filterBulan - 1).toLocaleString('id-ID', { month: 'long' })} {filterTahun}</p>
        </div>

        {activeTab === "dashboard" && <DashboardLaporan data={dashboardData as unknown as React.ComponentProps<typeof DashboardLaporan>["data"]} />}
        {activeTab === "penugasan" && <LaporanPenugasan data={penugasanData as unknown as React.ComponentProps<typeof LaporanPenugasan>["data"]} onOpenDetail={setSelectedSantriId} />}
        {activeTab === "keaktifan" && <RekapKeaktifan data={rekapData as unknown as React.ComponentProps<typeof RekapKeaktifan>["data"]} onOpenDetail={setSelectedSantriId} />}
        {activeTab === "monitoring" && userRole === "KEPALA_SATKER" ? (
          <RiwayatLaporanKepalaSatker data={riwayatLaporanSatkerData as unknown as React.ComponentProps<typeof RiwayatLaporanKepalaSatker>["data"]} />
        ) : activeTab === "monitoring" && (
          <LaporanMonitoring data={monitoringData as unknown as React.ComponentProps<typeof LaporanMonitoring>["data"]} onOpenDetail={setSelectedSantriId} />
        )}
        {activeTab === "export" && <RiwayatExport data={exportHistoryData as unknown as React.ComponentProps<typeof RiwayatExport>["data"]} />}
      </div>

      <DetailSantriModal 
        isOpen={!!selectedSantriId} 
        onClose={() => setSelectedSantriId(null)} 
        residentId={selectedSantriId} 
      />
    </div>
  )
}
