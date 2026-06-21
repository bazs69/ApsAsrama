"use client"

import { useState, useTransition } from "react"
import { createKegiatan, deleteKegiatan, updateAbsensiKegiatanStatus, getKegiatanDetail, getAllAbsensiDetail, updateKegiatan } from "@/app/actions/absensiKegiatan"
import { KehadiranStatus } from "@prisma/client"
import { Plus, Search, Trash2, X, AlertCircle, Loader2, CalendarCheck, Users, Info, ChevronRight, CheckCircle, XCircle, Clock, ChevronDown, Calendar, Filter, Edit, FileText, Printer } from "lucide-react"
import * as XLSX from "xlsx"

interface KegiatanSummary {
  id: string
  nama: string
  tanggal: Date
  keterangan: string | null
  hadirCount: number
  totalCount: number
}

interface AbsensiDetail {
  id: string
  resident: { id: string, name: string }
  status: KehadiranStatus
  keterangan: string | null
}

export default function AbsensiKegiatanClient({
  initialKegiatans,
  kbmOptions
}: {
  initialKegiatans: KegiatanSummary[]
  kbmOptions: { id: string; name: string }[]
}) {
  const [kegiatans, setKegiatans] = useState<KegiatanSummary[]>(initialKegiatans)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filterNama, setFilterNama] = useState("")

  const [isPending, startTransition] = useTransition()
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [nama, setNama] = useState("")
  const [tanggal, setTanggal] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [error, setError] = useState("")

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editId, setEditId] = useState("")
  const [editNama, setEditNama] = useState("")
  const [editTanggal, setEditTanggal] = useState("")
  const [editKeterangan, setEditKeterangan] = useState("")
  const [editError, setEditError] = useState("")

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string | null>(null)
  const [selectedKegiatanNama, setSelectedKegiatanNama] = useState("")
  const [absensiList, setAbsensiList] = useState<AbsensiDetail[]>([])
  const [detailSearch, setDetailSearch] = useState("")
  const [loadingDetail, setLoadingDetail] = useState(false)

  const uniqueNamas = Array.from(new Set(kegiatans.map(k => k.nama))).sort()

  const filteredKegiatan = kegiatans.filter(k => {
    const matchName = k.nama.toLowerCase().includes(search.toLowerCase())
    const matchDropdown = filterNama === "" || k.nama === filterNama
    let matchDate = true
    if (startDate || endDate) {
       const kDate = new Date(k.tanggal)
       kDate.setHours(0,0,0,0)
       if (startDate) {
         const sDate = new Date(startDate)
         sDate.setHours(0,0,0,0)
         if (kDate < sDate) matchDate = false
       }
       if (endDate) {
         const eDate = new Date(endDate)
         eDate.setHours(0,0,0,0)
         if (kDate > eDate) matchDate = false
       }
    }
    return matchName && matchDropdown && matchDate
  })



  const handleExportDetail = async () => {
    const allData = await getAllAbsensiDetail()
    const filteredIds = new Set(filteredKegiatan.map(k => k.id))
    const relevantActivities = allData.filter((k: { id: string }) => filteredIds.has(k.id))

    const excelData: Record<string, string>[] = []
    relevantActivities.forEach((k: { nama: string, tanggal: Date | string, absensi: { resident: { name: string }, status: string, keterangan?: string | null }[] }) => {
      k.absensi.forEach((a: { resident: { name: string }, status: string, keterangan?: string | null }) => {
        excelData.push({
          "Nama Kegiatan": k.nama,
          "Tanggal": new Date(k.tanggal).toLocaleDateString('id-ID'),
          "Nama Santri": a.resident.name,
          "Status Kehadiran": a.status,
          "Keterangan": a.keterangan || ""
        })
      })
    })

    if (excelData.length === 0) {
      alert("Tidak ada data detail untuk diexport.")
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Absensi")
    XLSX.writeFile(workbook, `Detail_Absensi_Santri_${new Date().getTime()}.xlsx`)
  }

  const handlePrintPDF = async () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const allData = await getAllAbsensiDetail()
    const filteredIds = new Set(filteredKegiatan.map(k => k.id))
    const relevantActivities = allData.filter((k: { id: string }) => filteredIds.has(k.id))

    if (relevantActivities.length === 0) {
      printWindow.close()
      alert("Tidak ada data untuk dicetak.")
      return
    }

    let rowsHtml = ""
    let index = 1
    relevantActivities.forEach((k: { nama: string, tanggal: Date | string, absensi: { resident: { name: string }, status: string, keterangan?: string | null }[] }) => {
      k.absensi.forEach((a: { resident: { name: string }, status: string, keterangan?: string | null }) => {
        rowsHtml += `
          <tr>
            <td>${index++}</td>
            <td>${k.nama}</td>
            <td>${new Date(k.tanggal).toLocaleDateString('id-ID')}</td>
            <td style="font-weight: 600;">${a.resident.name}</td>
            <td>
              <span class="badge ${
                a.status === 'HADIR' ? 'badge-hadir' : 
                a.status === 'ALPA' ? 'badge-alpa' : 
                a.status === 'IZIN' ? 'badge-izin' : 'badge-lainnya'
              }">
                ${a.status}
              </span>
            </td>
            <td>${a.keterangan || "-"}</td>
          </tr>
        `
      })
    })

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Absensi Kegiatan - DormiSync</title>
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
            .badge-alpa { background-color: #fee2e2; color: #991b1b; }
            .badge-izin { background-color: #fef3c7; color: #92400e; }
            .badge-lainnya { background-color: #dbeafe; color: #1e40af; }
            .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN ABSENSI KEGIATAN SANTRI</h1>
            <p>Sistem Informasi Manajemen Asrama DormiSync • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kegiatan</th>
                <th>Tanggal</th>
                <th>Nama Santri</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
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

  const openCreateModal = () => {
    setNama("")
    setTanggal(new Date().toISOString().split('T')[0])
    setKeterangan("")
    setError("")
    setIsCreateOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!nama.trim()) {
      setError("Nama kegiatan harus diisi.")
      return
    }

    startTransition(async () => {
      const res = await createKegiatan({
        nama,
        tanggal: new Date(tanggal),
        keterangan: keterangan || undefined
      })

      if (res.error) {
        setError(res.error)
      } else if (res.success && res.kegiatanId) {
        setIsCreateOpen(false)
        openDetailModal(res.kegiatanId, nama)
        
        const newObj: KegiatanSummary = {
          id: res.kegiatanId,
          nama,
          tanggal: new Date(tanggal),
          keterangan: keterangan || null,
          hadirCount: 0, 
          totalCount: 0 
        }
        setKegiatans(prev => [newObj, ...prev])
      }
    })
  }

  const openEditModal = (e: React.MouseEvent, k: KegiatanSummary) => {
    e.stopPropagation()
    setEditId(k.id)
    setEditNama(k.nama)
    setEditTanggal(new Date(k.tanggal).toISOString().split('T')[0])
    setEditKeterangan(k.keterangan || "")
    setEditError("")
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError("")
    
    if (!editNama.trim()) {
      setEditError("Nama kegiatan harus diisi.")
      return
    }

    startTransition(async () => {
      const res = await updateKegiatan(editId, {
        nama: editNama,
        tanggal: new Date(editTanggal),
        keterangan: editKeterangan || undefined
      })

      if (res.error) {
        setEditError(res.error)
      } else if (res.success) {
        setIsEditOpen(false)
        setKegiatans(prev => prev.map(k => {
          if (k.id === editId) {
            return {
              ...k,
              nama: editNama,
              tanggal: new Date(editTanggal),
              keterangan: editKeterangan || null
            }
          }
          return k
        }))
      }
    })
  }

  const openDetailModal = async (id: string, nama: string) => {
    setSelectedKegiatanId(id)
    setSelectedKegiatanNama(nama)
    setDetailModalOpen(true)
    setLoadingDetail(true)
    setDetailSearch("")

    const detail = await getKegiatanDetail(id)
    if (detail) {
      setAbsensiList(detail.absensi as AbsensiDetail[])
      
      // Update counts in the main list
      const hadirCount = detail.absensi.filter(a => a.status === KehadiranStatus.HADIR).length
      setKegiatans(prev => prev.map(k => k.id === id ? { ...k, hadirCount, totalCount: detail.absensi.length } : k))
    }
    setLoadingDetail(false)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent opening detail modal
    if (!confirm("Hapus kegiatan ini beserta seluruh data absensinya?")) return

    const res = await deleteKegiatan(id)
    if (res.error) {
      alert(res.error)
    } else {
      setKegiatans(prev => prev.filter(k => k.id !== id))
    }
  }

  const toggleStatus = async (absensiId: string, currentStatus: KehadiranStatus) => {
    // Cycle through states: HADIR -> ALPA -> SAKIT -> IZIN -> HADIR
    const nextStatusMap: Record<KehadiranStatus, KehadiranStatus> = {
      HADIR: KehadiranStatus.ALPA,
      ALPA: KehadiranStatus.SAKIT,
      SAKIT: KehadiranStatus.IZIN,
      IZIN: KehadiranStatus.HADIR,
    }
    const newStatus = nextStatusMap[currentStatus]

    // Optimistic UI update
    setAbsensiList(prev => prev.map(a => a.id === absensiId ? { ...a, status: newStatus } : a))

    const res = await updateAbsensiKegiatanStatus(absensiId, newStatus)
    if (res.error) {
      alert(res.error)
      // Revert if failed
      setAbsensiList(prev => prev.map(a => a.id === absensiId ? { ...a, status: currentStatus } : a))
    } else {
      // Update parent counts
      setKegiatans(prev => prev.map(k => {
        if (k.id === selectedKegiatanId) {
          const adjHadir = (currentStatus === "HADIR" ? -1 : 0) + (newStatus === "HADIR" ? 1 : 0)
          return { ...k, hadirCount: k.hadirCount + adjHadir }
        }
        return k
      }))
    }
  }

  const filteredAbsensi = absensiList.filter(a => 
    a.resident.name.toLowerCase().includes(detailSearch.toLowerCase())
  )

  const renderStatusBadge = (status: KehadiranStatus) => {
    switch (status) {
      case "HADIR":
        return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold uppercase flex items-center space-x-1.5"><CheckCircle className="w-3.5 h-3.5"/><span>Hadir</span></span>
      case "ALPA":
        return <span className="px-3 py-1 bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20 rounded-lg text-xs font-bold uppercase flex items-center space-x-1.5"><XCircle className="w-3.5 h-3.5"/><span>Alpa</span></span>
      case "SAKIT":
        return <span className="px-3 py-1 bg-blue-500/10 text-blue-650 dark:text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold uppercase flex items-center space-x-1.5"><Info className="w-3.5 h-3.5"/><span>Sakit</span></span>
      case "IZIN":
        return <span className="px-3 py-1 bg-amber-500/10 text-amber-650 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase flex items-center space-x-1.5"><Clock className="w-3.5 h-3.5"/><span>Izin</span></span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Absensi Kegiatan</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Kelola daftar kegiatan dan catat kehadiran santri secara massal.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={handleExportDetail}
              className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all flex items-center justify-center"
              title="Ekspor Data ke Excel"
            >
              <FileText className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button
              onClick={handlePrintPDF}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"
              title="Cetak Laporan (PDF)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl py-2.5 px-4 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Kegiatan Baru</span>
          </button>
        </div>
      </div>

      {/* Filter - Minimal & Simple Styled */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Dropdown Nama KBM */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Filter className="w-4 h-4 text-indigo-500" />
          </div>
          <select
            value={filterNama}
            onChange={(e) => setFilterNama(e.target.value)}
            className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer transition-all hover:border-zinc-300 dark:hover:border-zinc-700 min-w-[160px]"
          >
            <option value="">Semua KBM</option>
            {uniqueNamas.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
        </div>

        {/* Text Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
          <input
            type="text"
            placeholder="Cari kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
          />
        </div>

        {/* Date Filters */}
        <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
          <div className="pl-3 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 p-1.5 rounded-lg ml-1 mr-2">
            <Calendar className="w-4 h-4" />
          </div>
          <input 
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-transparent border-0 py-1.5 px-2 text-sm text-zinc-700 dark:text-zinc-300 focus:ring-0 outline-none w-[115px] cursor-pointer"
            title="Mulai Tanggal"
          />
          <span className="text-zinc-300 dark:text-zinc-600 px-2 font-medium">~</span>
          <input 
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-transparent border-0 py-1.5 px-2 text-sm text-zinc-700 dark:text-zinc-300 focus:ring-0 outline-none w-[115px] cursor-pointer"
            title="Sampai Tanggal"
          />
        </div>
      </div>

      {/* Grid of Kegiatan */}
      {filteredKegiatan.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
          Belum ada riwayat kegiatan yang tercatat.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKegiatan.map(k => (
            <div 
              key={k.id} 
              onClick={() => openDetailModal(k.id, k.nama)}
              className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary-500/10 text-primary-600 dark:text-primary-400 p-3 rounded-xl">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => openEditModal(e, k)}
                    className="p-2 text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, k.id)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus Kegiatan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight mb-1">{k.nama}</h3>
              <p className="text-zinc-500 text-sm mb-6 flex-1">{new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Users className="w-4 h-4" />
                  <span><strong className="text-zinc-900 dark:text-white">{k.hadirCount}</strong> / {k.totalCount} Hadir</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-primary-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create Kegiatan */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="w-full max-w-lg glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Buat Kegiatan Baru</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Nama Kegiatan
                </label>
                <div className="relative group">
                  <select
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
                  >
                    <option value="" disabled>Pilih Kegiatan (KBM)</option>
                    {kbmOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Keterangan (Opsional)</label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Tulis catatan jika ada..."
                />
              </div>

              <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-xl flex space-x-3 mt-4">
                <Info className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary-700 dark:text-primary-300 leading-relaxed">
                  Saat Anda menyimpan kegiatan ini, sistem otomatis mendaftarkan <strong>seluruh santri aktif</strong> dengan status awal <strong>Hadir</strong>. Anda bisa mengubahnya nanti.
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Buat & Mulai Absen</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Checklist */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDetailModalOpen(false)} />
          <div className="w-full max-w-3xl glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedKegiatanNama}</h2>
                <p className="text-sm text-zinc-500">Klik status kehadiran untuk mengubahnya secara cepat.</p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 p-2 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                <input
                  type="text"
                  placeholder="Cari nama santri..."
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50/50 dark:bg-transparent">
              {loadingDetail ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : filteredAbsensi.length === 0 ? (
                <div className="text-center p-8 text-zinc-500">
                  Data santri tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAbsensi.map(a => (
                    <div 
                      key={a.id} 
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-primary-500/30 transition-colors shadow-sm"
                    >
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm truncate pr-4">{a.resident.name}</span>
                      <button 
                        onClick={() => toggleStatus(a.id, a.status)}
                        className="flex-shrink-0 transition-transform active:scale-95"
                        title="Klik untuk ubah status (Hadir -> Alpa -> Sakit -> Izin)"
                      >
                        {renderStatusBadge(a.status)}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex justify-end">
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Kegiatan */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="w-full max-w-lg glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Kegiatan</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Nama Kegiatan
                </label>
                <div className="relative group">
                  <select
                    required
                    value={editNama}
                    onChange={(e) => setEditNama(e.target.value)}
                    className="w-full appearance-none bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
                  >
                    <option value="" disabled>Pilih Kegiatan (KBM)</option>
                    {kbmOptions.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Keterangan (Opsional)</label>
                <textarea
                  rows={2}
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
