"use client"

import { useState, useTransition } from "react"
import { createAbsensiMuallim, deleteAbsensiMuallim } from "@/app/actions/absensiMuallim"
import { AbsensiStatus } from "@prisma/client"
import { Plus, Search, LogOut, X, AlertCircle, Loader2, CalendarCheck, BookOpen, User, Info, FileText, Printer } from "lucide-react"

interface Muallim {
  id: string
  name: string
  kbm: string
}

interface Absensi {
  id: string
  hari: string
  tanggal: Date
  muallimId: string
  status: AbsensiStatus
  keterangan: string | null
  muallim: Muallim
}

export default function AbsensiMuallimClient({
  initialAbsensi,
  muallims
}: {
  initialAbsensi: Absensi[]
  muallims: Muallim[]
}) {
  const [absensis, setAbsensis] = useState<Absensi[]>(initialAbsensi)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form fields
  const [hari, setHari] = useState("")
  const [tanggal, setTanggal] = useState("")
  const [muallimId, setMuallimId] = useState("")
  const [status, setStatus] = useState<AbsensiStatus>(AbsensiStatus.HADIR)
  const [keterangan, setKeterangan] = useState("")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Filtered
  const filteredAbsensi = absensis.filter(a =>
    a.muallim.name.toLowerCase().includes(search.toLowerCase()) ||
    a.muallim.kbm.toLowerCase().includes(search.toLowerCase()) ||
    a.hari.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setHari("")
    setTanggal(new Date().toISOString().split('T')[0])
    setMuallimId("")
    setStatus(AbsensiStatus.HADIR)
    setKeterangan("")
    setError("")
    setIsModalOpen(true)
  }

  // Auto-fill hari when date changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value
    setTanggal(dateVal)
    if (dateVal) {
      const dateObj = new Date(dateVal)
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      setHari(days[dateObj.getDay()])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      const res = await createAbsensiMuallim({
        hari,
        tanggal: new Date(tanggal),
        muallimId,
        status,
        keterangan: keterangan || undefined
      })

      if (res.error) {
        setError(res.error)
      } else if (res.success && res.absensi) {
        setAbsensis(prev => [res.absensi as Absensi, ...prev])
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data absensi ini?")) return

    const res = await deleteAbsensiMuallim(id)
    if (res.error) {
      alert(res.error)
    } else {
      setAbsensis(prev => prev.filter(a => a.id !== id))
    }
  }

  // Selected muallim details
  const selectedMuallim = muallims.find(m => m.id === muallimId)

  const exportToCSV = () => {
    const headers = ["Hari", "Tanggal", "Pemateri / Muallim", "KBM", "Status", "Keterangan"]
    const rows = filteredAbsensi.map(a => [
      a.hari,
      new Date(a.tanggal).toLocaleDateString('id-ID'),
      a.muallim.name,
      a.muallim.kbm,
      a.status,
      a.keterangan || "-"
    ])

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Absensi_Muallim_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Absensi Muallim - DormiSync</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #111827; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f9fafb; font-weight: 600; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .badge-hadir { background-color: #d1fae5; color: #065f46; }
            .badge-izin { background-color: #fef3c7; color: #92400e; }
            .badge-lainnya { background-color: #dbeafe; color: #1e40af; }
            .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN ABSENSI MUALLIM</h1>
            <p>Sistem Informasi Manajemen Asrama DormiSync • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Hari / Tanggal</th>
                <th>Pemateri / Muallim</th>
                <th>KBM</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAbsensi.map((a, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${a.hari}, ${new Date(a.tanggal).toLocaleDateString('id-ID')}</td>
                  <td style="font-weight: 600;">${a.muallim.name}</td>
                  <td>${a.muallim.kbm}</td>
                  <td>
                    <span class="badge ${
                      a.status === 'HADIR' ? 'badge-hadir' : 
                      a.status === 'IZIN' ? 'badge-izin' : 'badge-lainnya'
                    }">
                      ${a.status}
                    </span>
                  </td>
                  <td>${a.keterangan || "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            Dicetak secara otomatis melalui Sistem Asrama DormiSync pada ${new Date().toLocaleString('id-ID')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Absensi Muallim</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Catat kehadiran muallim pada kegiatan belajar mengajar.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={exportToCSV}
              className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all flex items-center justify-center tooltip-trigger relative"
              title="Ekspor Data ke CSV"
            >
              <FileText className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button
              onClick={printPDF}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center tooltip-trigger relative"
              title="Cetak Laporan (PDF)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={openAddModal}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl py-2.5 px-4 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Isi Absensi</span>
          </button>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari nama muallim, KBM, atau hari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Table */}
      {filteredAbsensi.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
          Belum ada riwayat absensi yang tercatat.
        </div>
      ) : (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">
                  <th className="py-4 px-6">HARI / TANGGAL</th>
                  <th className="py-4 px-6">Pemateri / Muallim</th>
                  <th className="py-4 px-6">KBM</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-300">
                {filteredAbsensi.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white">{a.hari}, {new Date(a.tanggal).toLocaleDateString('id-ID')}</div>
                    </td>
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                       <User className="w-4 h-4 text-primary-500" />
                       <span>{a.muallim.name}</span>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                      {a.muallim.kbm}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-start space-y-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          a.status === AbsensiStatus.HADIR
                            ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20"
                            : a.status === AbsensiStatus.IZIN
                            ? "bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-650 dark:text-blue-400 border border-blue-500/20"
                        }`}>
                          {a.status}
                        </span>
                        {a.keterangan && (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[200px] truncate" title={a.keterangan}>
                            {a.keterangan}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-block"
                        title="Hapus Data"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="w-full max-w-lg glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Form Absensi Muallim</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Tanggal</label>
                  <div className="relative">
                    <CalendarCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                    <input
                      type="date"
                      required
                      value={tanggal}
                      onChange={handleDateChange}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Hari</label>
                  <input
                    type="text"
                    required
                    value={hari}
                    onChange={(e) => setHari(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    placeholder="Contoh: Senin"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Pemateri / Muallim</label>
                <select
                  required
                  value={muallimId}
                  onChange={(e) => setMuallimId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="" disabled>Pilih Muallim...</option>
                  {muallims.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {selectedMuallim && (
                <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-start space-x-3 text-sm">
                  <BookOpen className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-primary-700 dark:text-primary-400">KBM yang diajarkan:</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{selectedMuallim.kbm}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Status Kehadiran</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AbsensiStatus)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value={AbsensiStatus.HADIR}>Hadir</option>
                  <option value={AbsensiStatus.IZIN}>Izin</option>
                  <option value={AbsensiStatus.DIWAKILKAN}>Diwakilkan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Keterangan (Opsional)</label>
                <div className="relative">
                  <Info className="w-4 h-4 absolute left-3 top-4 text-zinc-450" />
                  <textarea
                    rows={2}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    placeholder="Tulis catatan jika ada..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Simpan Absensi</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
