"use client"

import { useState } from "react"
import { Search, Save, FileText, CheckCircle, Printer, ChevronDown, Edit3, X, Star } from "lucide-react"
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
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
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
    return "border-zinc-200 dark:border-zinc-800 focus:border-primary-500 focus:ring-primary-500/20"
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Monitoring Penugasan</h1>
          <div className="flex items-center space-x-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <span>Satker: <span className="text-primary-600 dark:text-primary-400 font-bold">{satker.name}</span></span>
            <span>•</span>
            <span>Periode: <span className="text-primary-600 dark:text-primary-400 font-bold">{MONTH_NAMES[currentMonth - 1]} {currentYear}</span></span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {laporanBulanan?.status === "SUBMITTED" && (
            <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/200/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-sm font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Sudah Submit</span>
            </span>
          )}
          {laporanBulanan?.status === "DRAFT" && (
            <span className="px-3 py-1.5 bg-primary-500/10 text-primary-600 border border-primary-500/20 rounded-lg text-sm font-bold flex items-center space-x-1.5">
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
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
        />
      </div>

      {/* Table of Santri */}
      <div className="bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-primary-50/80 to-emerald-50/80 dark:from-primary-900/10 dark:to-emerald-900/10 border-b border-primary-100 dark:border-primary-900/30 text-xs font-bold text-primary-800 dark:text-primary-300 uppercase tracking-widest">
                <th className="py-4 px-6">Nama Santri & NIS</th>
                <th className="py-4 px-6 text-center">Status Penilaian</th>
                <th className="py-4 px-6 text-center">Nilai Rata-rata</th>
                <th className="py-4 px-6 text-right">Aksi Penilaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-sm">
              {filteredAssignments.map((assignment) => {
                const data = monitoringData[assignment.id]
                const preview = calculatePreview(data)
                const isComplete = CRITERIA.every(c => data[c.key] > 0)

                return (
                  <tr key={assignment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white text-base">
                        {assignment.resident.name}
                      </div>
                      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                        NIS: {assignment.resident.nim || "-"}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        {isComplete ? (
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-50 dark:bg-emerald-900/200/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm shadow-emerald-500/10">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Lengkap</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm shadow-rose-500/10">
                            Belum Lengkap
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {preview.average > 0 ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className={`text-xl font-black ${preview.predicateColor}`}>
                            {preview.average.toFixed(2)}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-widest ${preview.predicateColor}`}>
                            {preview.predicate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-600 font-medium italic">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedAssignmentId(assignment.id)}
                        className="px-4 py-2 bg-gradient-to-tr from-primary-600 to-emerald-500 hover:from-primary-500 hover:to-emerald-400 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-primary-500/25 active:scale-95 inline-flex items-center space-x-2"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isReadOnly ? "Lihat Nilai" : "Beri Nilai"}</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-800/20 italic">
                    Tidak ada santri yang ditugaskan di satker ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Card Form Penilaian overlay */}
      {selectedAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedAssignmentId(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            {/* Find selected data */}
            {(() => {
              const assignment = filteredAssignments.find(a => a.id === selectedAssignmentId);
              if (!assignment) return null;

              const data = monitoringData[assignment.id];
              const preview = calculatePreview(data);

              return (
                <>
                  <div className={`p-6 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-br ${preview.bgGradient}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-zinc-900 dark:text-white capitalize leading-tight">
                          {assignment.resident.name}
                        </h2>
                        <p className="text-sm text-zinc-500 font-mono mt-1">NIS: {assignment.resident.nim || "-"}</p>
                      </div>

                      <div className="text-right bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50/50 dark:bg-black/20 backdrop-blur rounded-2xl p-3 border border-zinc-200/50 dark:border-zinc-700/30">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center justify-end space-x-1">
                          <Star className="w-3 h-3" />
                          <span>Rata-Rata</span>
                        </p>
                        <div className="flex flex-col items-end">
                          <span className={`text-3xl leading-none font-black ${preview.predicateColor}`}>
                            {preview.average > 0 ? preview.average.toFixed(2) : "-"}
                          </span>
                          <span className={`text-xs font-bold uppercase mt-1 ${preview.predicateColor}`}>
                            {preview.average > 0 ? preview.predicate : "Belum dinilai"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
                      {CRITERIA.map(crit => {
                        const currentValue = data[crit.key];
                        const options = OPTIONS_MAP[crit.key];
                        return (
                          <div key={crit.key} className="flex flex-col space-y-2">
                            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{crit.label}</label>
                            <div className="relative">
                              <select
                                value={currentValue || ""}
                                onChange={(e) => handleScoreChange(assignment.id, crit.key, Number(e.target.value))}
                                disabled={isReadOnly}
                                className={`w-full bg-zinc-50 dark:bg-zinc-800/80 border rounded-xl py-3 pl-4 pr-10 text-sm font-medium focus:ring-2 outline-none transition-all appearance-none cursor-pointer disabled:cursor-not-allowed ${getDropdownBorderColor(currentValue)}`}
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

                    <div className="mt-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">Saran Kepala Satker (Opsional)</label>
                      <textarea
                        value={data.supervisorNotes}
                        onChange={(e) => handleNotesChange(assignment.id, e.target.value)}
                        disabled={isReadOnly}
                        rows={3}
                        placeholder="Berikan masukan, kritik, apresiasi, atau saran untuk performa santri ini..."
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none transition-colors disabled:opacity-75"
                      />
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                    <button
                      onClick={() => setSelectedAssignmentId(null)}
                      className="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-md shadow-primary-500/20 active:scale-95 transition-all w-full sm:w-auto text-center"
                    >
                      {isReadOnly ? "Tutup" : "Selesai Penilaian"}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Kesimpulan */}
      <div className="bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 border border-success-100 dark:border-success-900/30 hover:border-success-300 dark:hover:border-success-700/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Kesimpulan & Evaluasi Bulanan</h3>
        <textarea
          value={kesimpulan}
          onChange={(e) => setKesimpulan(e.target.value)}
          disabled={isReadOnly}
          rows={5}
          placeholder="Tuliskan evaluasi menyeluruh kinerja satker bulan ini..."
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y transition-colors disabled:opacity-75"
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
              className="w-full sm:w-auto px-6 py-2.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold border border-primary-200 dark:border-primary-500/20 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingDraft ? "Menyimpan..." : "Simpan Draft"}</span>
            </button>

            <button
              onClick={() => handleSave("SUBMITTED")}
              disabled={isSavingDraft || isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-primary-500/30"
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

