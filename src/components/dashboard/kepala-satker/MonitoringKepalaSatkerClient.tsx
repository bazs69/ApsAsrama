"use client"

import { useState } from "react"
import { Search, Save, FileText, CheckCircle, Printer } from "lucide-react"
import { saveMonitoringSatker, type SaveMonitoringSatkerInput } from "@/app/actions/laporan"

interface AssignmentData {
  id: string
  resident: {
    name: string
    nim: string
  }
  monitorings: {
    statusMonitoring: string
    catatanMonitoring: string | null
  }[]
}

interface MonitoringKepalaSatkerClientProps {
  satker: {
    id: string
    name: string
    assignments: AssignmentData[]
  }
  laporanBulanan: {
    id: string
    status: string
    kesimpulan: string | null
  } | null
  currentMonth: number
  currentYear: number
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export default function MonitoringKepalaSatkerClient({
  satker,
  laporanBulanan,
  currentMonth,
  currentYear
}: MonitoringKepalaSatkerClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [kesimpulan, setKesimpulan] = useState(laporanBulanan?.kesimpulan || "")
  
  // Initialize state with default or existing values
  const [monitoringData, setMonitoringData] = useState<Record<string, { status: string, catatan: string }>>(() => {
    const initial: Record<string, { status: string, catatan: string }> = {}
    satker.assignments.forEach(assignment => {
      const existing = assignment.monitorings[0]
      initial[assignment.id] = {
        status: existing?.statusMonitoring || "",
        catatan: existing?.catatanMonitoring || ""
      }
    })
    return initial
  })

  // Calculate stats
  let sangatAktif = 0
  let aktif = 0
  let cukupAktif = 0
  let kurangAktif = 0
  
  Object.values(monitoringData).forEach(m => {
    if (m.status === "Sangat Aktif") sangatAktif++
    else if (m.status === "Aktif") aktif++
    else if (m.status === "Cukup Aktif") cukupAktif++
    else if (m.status === "Kurang Aktif") kurangAktif++
  })

  const filteredAssignments = satker.assignments.filter(a => 
    a.resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.resident.nim.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSave = async (statusLaporan: "DRAFT" | "SUBMITTED") => {
    try {
      if (statusLaporan === "DRAFT") setIsSavingDraft(true)
      else setIsSubmitting(true)

      const payload: SaveMonitoringSatkerInput = {
        satkerId: satker.id,
        bulan: currentMonth,
        tahun: currentYear,
        kesimpulan,
        statusLaporan,
        monitorings: Object.entries(monitoringData)
          .filter((entry) => entry[1].status !== "") // Only save if status is selected
          .map(([assignmentId, data]) => ({
            assignmentId,
            status: data.status,
            catatan: data.catatan
          }))
      }

      const res = await saveMonitoringSatker(payload)
      if (res.success) {
        alert(statusLaporan === "DRAFT" ? "Draft berhasil disimpan" : "Laporan berhasil disubmit")
      } else {
        alert(res.error || "Gagal menyimpan")
      }
    } catch {
      alert("Terjadi kesalahan sistem")
    } finally {
      setIsSavingDraft(false)
      setIsSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const isReadOnly = laporanBulanan?.status === "SUBMITTED"

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Print Header */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">LAPORAN MONITORING PENUGASAN SANTRI</h1>
        <h2 className="text-xl font-bold uppercase">{satker.name}</h2>
        <p className="text-lg">Periode: {MONTH_NAMES[currentMonth - 1]} {currentYear}</p>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Monitoring Penugasan</h1>
          <div className="flex items-center space-x-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <span>Satker: <span className="text-blue-600 dark:text-blue-400 font-bold">{satker.name}</span></span>
            <span>•</span>
            <span>Periode: <span className="text-blue-600 dark:text-blue-400 font-bold">{MONTH_NAMES[currentMonth - 1]} {currentYear}</span></span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {laporanBulanan?.status === "SUBMITTED" && (
            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Sudah Submit</span>
            </span>
          )}
          {laporanBulanan?.status === "DRAFT" && (
            <span className="px-3 py-1.5 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-lg text-sm font-bold flex items-center space-x-1.5">
              <FileText className="w-4 h-4" />
              <span>Draft Tersimpan</span>
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
        <div className="glass rounded-xl p-4 border border-blue-500/20">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Total Anggota</p>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{satker.assignments.length}</h3>
        </div>
        <div className="glass rounded-xl p-4 border border-emerald-500/20">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Sangat Aktif</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{sangatAktif}</h3>
        </div>
        <div className="glass rounded-xl p-4 border border-teal-500/20">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Aktif</p>
          <h3 className="text-2xl font-bold text-teal-600 dark:text-teal-400">{aktif}</h3>
        </div>
        <div className="glass rounded-xl p-4 border border-amber-500/20">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Cukup Aktif</p>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">{cukupAktif}</h3>
        </div>
        <div className="glass rounded-xl p-4 border border-red-500/20">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold mb-1">Kurang Aktif</p>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{kurangAktif}</h3>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center print:hidden">
          <h3 className="font-bold text-zinc-900 dark:text-white">Form Monitoring Anggota</h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari santri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm print:text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 print:bg-transparent print:border-b-2 print:border-black">
              <tr>
                <th className="px-4 py-3 font-semibold">Nama Santri</th>
                <th className="px-4 py-3 font-semibold">NIS/NIM</th>
                <th className="px-4 py-3 font-semibold w-48">Status Keaktifan</th>
                <th className="px-4 py-3 font-semibold">Catatan (Opsional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 print:divide-zinc-300">
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/25 transition-colors print:hover:bg-transparent">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white print:text-black">
                    {assignment.resident.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 print:text-black">
                    {assignment.resident.nim}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={monitoringData[assignment.id]?.status || ""}
                      onChange={(e) => setMonitoringData(prev => ({
                        ...prev,
                        [assignment.id]: { ...prev[assignment.id], status: e.target.value }
                      }))}
                      disabled={isReadOnly}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none print:appearance-none print:bg-transparent print:p-0 print:font-semibold"
                    >
                      <option value="" disabled>Pilih Status...</option>
                      <option value="Sangat Aktif">Sangat Aktif</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Cukup Aktif">Cukup Aktif</option>
                      <option value="Kurang Aktif">Kurang Aktif</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={monitoringData[assignment.id]?.catatan || ""}
                      onChange={(e) => setMonitoringData(prev => ({
                        ...prev,
                        [assignment.id]: { ...prev[assignment.id], catatan: e.target.value }
                      }))}
                      disabled={isReadOnly}
                      rows={1}
                      placeholder="Tambahkan catatan jika ada..."
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none print:bg-transparent print:p-0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kesimpulan */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 print:border-none print:shadow-none print:p-0 print:mt-6">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4 print:text-lg">Kesimpulan & Evaluasi Bulanan</h3>
        <textarea
          value={kesimpulan}
          onChange={(e) => setKesimpulan(e.target.value)}
          disabled={isReadOnly}
          rows={5}
          placeholder="Tuliskan evaluasi menyeluruh kinerja satker bulan ini..."
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y print:border-none print:p-0 print:bg-transparent"
        />
      </div>

      {/* Print Signatures */}
      <div className="hidden print:flex justify-between mt-16 pt-8 px-12">
        <div className="text-center">
          <p className="mb-20">Mengetahui,<br/>Pembina Asrama</p>
          <p className="font-bold border-b border-black inline-block px-4">____________________</p>
        </div>
        <div className="text-center">
          <p className="mb-20">Jember, {new Date().toLocaleDateString('id-ID')}<br/>Kepala Satker</p>
          <p className="font-bold border-b border-black inline-block px-4">____________________</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak PDF</span>
        </button>
        
        {!isReadOnly && (
          <>
            <button
              onClick={() => handleSave("DRAFT")}
              disabled={isSavingDraft || isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-500/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingDraft ? "Menyimpan..." : "Simpan Draft"}</span>
            </button>

            <button
              onClick={() => handleSave("SUBMITTED")}
              disabled={isSavingDraft || isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-blue-500/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Submit..." : "Submit Laporan"}</span>
            </button>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:flex, .print\\:block *, .print\\:flex *, .p-6, .p-6 * {
            visibility: visible;
          }
          .print\\:hidden, .print\\:hidden * {
            display: none !important;
          }
          .p-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}} />
    </div>
  )
}
