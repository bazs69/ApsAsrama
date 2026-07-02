"use client"

import { useState } from "react"
import { Search, Save, FileText, CheckCircle, Printer, ChevronDown } from "lucide-react"
import { saveMonitoringSatker, type SaveMonitoringSatkerInput } from "@/app/actions/laporan"

interface AssignmentData {
  id: string
  resident: {
    name: string
    nim: string | null
  }
  monitorings: {
    statusMonitoring: string
    catatanMonitoring: string | null
    attendanceScore?: number | null
    disciplineScore?: number | null
    responsibilityScore?: number | null
    workQualityScore?: number | null
    attitudeScore?: number | null
    teamworkScore?: number | null
    supervisorNotes?: string | null
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

const CRITERIA = [
  { key: "attendanceScore", label: "Kehadiran" },
  { key: "disciplineScore", label: "Kedisiplinan" },
  { key: "responsibilityScore", label: "Tanggung Jawab" },
  { key: "workQualityScore", label: "Kualitas Kerja" },
  { key: "attitudeScore", label: "Sikap dan Etika" },
  { key: "teamworkScore", label: "Kerja Sama" }
] as const;

type CriteriaKey = typeof CRITERIA[number]["key"];

const OPTIONS_MAP = {
  attendanceScore: [
    { value: 5, label: "Sangat Rajin" },
    { value: 4, label: "Rajin" },
    { value: 3, label: "Cukup Rajin" },
    { value: 2, label: "Kurang Rajin" },
    { value: 1, label: "Tidak Rajin" },
  ],
  disciplineScore: [
    { value: 5, label: "Sangat Disiplin" },
    { value: 4, label: "Disiplin" },
    { value: 3, label: "Cukup Disiplin" },
    { value: 2, label: "Kurang Disiplin" },
    { value: 1, label: "Tidak Disiplin" },
  ],
  responsibilityScore: [
    { value: 5, label: "Sangat Bertanggung Jawab" },
    { value: 4, label: "Bertanggung Jawab" },
    { value: 3, label: "Cukup Bertanggung Jawab" },
    { value: 2, label: "Kurang Bertanggung Jawab" },
    { value: 1, label: "Tidak Bertanggung Jawab" },
  ],
  workQualityScore: [
    { value: 5, label: "Hasil Kerja Sangat Memuaskan" },
    { value: 4, label: "Hasil Kerja Baik" },
    { value: 3, label: "Hasil Kerja Cukup Baik" },
    { value: 2, label: "Hasil Kerja Kurang Memuaskan" },
    { value: 1, label: "Hasil Kerja Tidak Memuaskan" },
  ],
  attitudeScore: [
    { value: 5, label: "Sangat Baik" },
    { value: 4, label: "Baik" },
    { value: 3, label: "Cukup Baik" },
    { value: 2, label: "Cukup" },
    { value: 1, label: "Tidak Baik" },
  ],
  teamworkScore: [
    { value: 5, label: "Sangat Kooperatif" },
    { value: 4, label: "Kooperatif" },
    { value: 3, label: "Cukup Kooperatif" },
    { value: 2, label: "Kurang Kooperatif" },
    { value: 1, label: "Tidak Kooperatif" },
  ],
} as const;

type ResidentScores = Record<CriteriaKey, number> & {
  supervisorNotes: string
}

function calculatePreview(scores: Record<CriteriaKey, number>) {
  const total = 
    scores.attendanceScore + 
    scores.disciplineScore + 
    scores.responsibilityScore + 
    scores.workQualityScore + 
    scores.attitudeScore + 
    scores.teamworkScore
  
  const average = total / 6

  let predicate = "-"
  let predicateColor = "text-zinc-500"
  let bgGradient = "from-zinc-500/10 to-transparent"

  if (average >= 4.5) { 
    predicate = "Sangat Baik"; 
    predicateColor = "text-emerald-600 dark:text-emerald-400"; 
    bgGradient = "from-emerald-500/5 to-transparent";
  } else if (average >= 3.5) { 
    predicate = "Baik"; 
    predicateColor = "text-teal-600 dark:text-teal-400"; 
    bgGradient = "from-teal-500/5 to-transparent";
  } else if (average >= 2.5) { 
    predicate = "Cukup"; 
    predicateColor = "text-amber-600 dark:text-amber-400"; 
    bgGradient = "from-amber-500/5 to-transparent";
  } else if (average >= 1.5) { 
    predicate = "Kurang"; 
    predicateColor = "text-orange-600 dark:text-orange-400"; 
    bgGradient = "from-orange-500/5 to-transparent";
  } else if (average > 0) { 
    predicate = "Sangat Kurang"; 
    predicateColor = "text-red-600 dark:text-red-400"; 
    bgGradient = "from-red-500/5 to-transparent";
  }

  return { total, average, predicate, predicateColor, bgGradient }
}

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
  
  const isReadOnly = laporanBulanan?.status === "SUBMITTED"

  const [monitoringData, setMonitoringData] = useState<Record<string, ResidentScores>>(() => {
    const initial: Record<string, ResidentScores> = {}
    satker.assignments.forEach(assignment => {
      const existing = assignment.monitorings[0]
      initial[assignment.id] = {
        attendanceScore: existing?.attendanceScore || 0,
        disciplineScore: existing?.disciplineScore || 0,
        responsibilityScore: existing?.responsibilityScore || 0,
        workQualityScore: existing?.workQualityScore || 0,
        attitudeScore: existing?.attitudeScore || 0,
        teamworkScore: existing?.teamworkScore || 0,
        supervisorNotes: existing?.supervisorNotes || existing?.catatanMonitoring || ""
      }
    })
    return initial
  })

  const filteredAssignments = satker.assignments.filter(a => 
    a.resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.resident.nim || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleScoreChange = (assignmentId: string, criteria: CriteriaKey, value: number) => {
    if (isReadOnly) return
    setMonitoringData(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        [criteria]: value
      }
    }))
  }

  const handleNotesChange = (assignmentId: string, value: string) => {
    if (isReadOnly) return
    setMonitoringData(prev => ({
      ...prev,
      [assignmentId]: {
        ...prev[assignmentId],
        supervisorNotes: value
      }
    }))
  }

  const handleSave = async (statusLaporan: "DRAFT" | "SUBMITTED") => {
    try {
      // Validate
      if (statusLaporan === "SUBMITTED") {
        for (const [, data] of Object.entries(monitoringData)) {
          const isComplete = CRITERIA.every(c => data[c.key] > 0)
          if (!isComplete) {
            alert("Harap lengkapi semua kriteria penilaian untuk seluruh santri sebelum Submit Laporan.")
            return
          }
        }
      }

      if (statusLaporan === "DRAFT") setIsSavingDraft(true)
      else setIsSubmitting(true)

      const payload: SaveMonitoringSatkerInput = {
        satkerId: satker.id,
        bulan: currentMonth,
        tahun: currentYear,
        kesimpulan,
        statusLaporan,
        monitorings: Object.entries(monitoringData).map(([assignmentId, data]) => ({
          assignmentId,
          attendanceScore: data.attendanceScore,
          disciplineScore: data.disciplineScore,
          responsibilityScore: data.responsibilityScore,
          workQualityScore: data.workQualityScore,
          attitudeScore: data.attitudeScore,
          teamworkScore: data.teamworkScore,
          supervisorNotes: data.supervisorNotes
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

  const getDropdownBorderColor = (val: number) => {
    if (val === 5) return "border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20"
    if (val === 4) return "border-teal-500/30 focus:border-teal-500 focus:ring-teal-500/20"
    if (val === 3) return "border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20"
    if (val === 2) return "border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/20"
    if (val === 1) return "border-red-500/30 focus:border-red-500 focus:ring-red-500/20"
    return "border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-500/20"
  }

  return (
    <div className="space-y-6 print:space-y-4">
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

      {/* Search Bar */}
      <div className="relative w-full max-w-md print:hidden">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Cari santri berdasarkan nama atau NIS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
        />
      </div>

      {/* Modern Cards for Monitoring */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredAssignments.map((assignment) => {
          const data = monitoringData[assignment.id]
          const preview = calculatePreview(data)

          return (
            <div 
              key={assignment.id} 
              className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-gradient-to-br ${preview.bgGradient}`}
            >
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{assignment.resident.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">NIS: {assignment.resident.nim || "-"}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Rata-rata</p>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">
                      {preview.average > 0 ? preview.average.toFixed(2) : "-"}
                    </span>
                    <span className={`text-sm font-bold ${preview.predicateColor}`}>
                      {preview.predicate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rubric Criteria Dropdown inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                {CRITERIA.map(crit => {
                  const currentValue = data[crit.key];
                  const options = OPTIONS_MAP[crit.key];
                  return (
                    <div key={crit.key} className="flex flex-col space-y-1.5">
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{crit.label}</span>
                      <div className="relative">
                        <select
                          value={currentValue || ""}
                          onChange={(e) => handleScoreChange(assignment.id, crit.key, Number(e.target.value))}
                          disabled={isReadOnly}
                          className={`w-full bg-zinc-50 dark:bg-zinc-800/50 border rounded-xl py-3 pl-4 pr-10 text-sm font-medium focus:ring-2 outline-none transition-all appearance-none cursor-pointer disabled:cursor-not-allowed ${getDropdownBorderColor(currentValue)}`}
                        >
                          <option value="" disabled className="text-zinc-400">Pilih penilaian...</option>
                          {options.map(opt => (
                            <option key={opt.value} value={opt.value} className="text-zinc-800 dark:text-zinc-200">
                              {opt.label} ({opt.value})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 transform -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Saran Kepala Satker (Opsional)</label>
                <textarea
                  value={data.supervisorNotes}
                  onChange={(e) => handleNotesChange(assignment.id, e.target.value)}
                  disabled={isReadOnly}
                  rows={2}
                  placeholder="Berikan masukan, kritik, atau saran..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y transition-colors disabled:opacity-75"
                />
              </div>

            </div>
          )
        })}
      </div>

      {/* Kesimpulan */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Kesimpulan & Evaluasi Bulanan</h3>
        <textarea
          value={kesimpulan}
          onChange={(e) => setKesimpulan(e.target.value)}
          disabled={isReadOnly}
          rows={5}
          placeholder="Tuliskan evaluasi menyeluruh kinerja satker bulan ini..."
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y transition-colors disabled:opacity-75"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pb-10">
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
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-blue-500/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? "Submit..." : "Submit Laporan"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
