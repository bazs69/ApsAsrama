"use client"

import { useState, useTransition, useRef } from "react"
import { bulkCreateResidents, bulkDeleteResidents, bulkMoveResidents } from "@/app/actions/residents"
import { ResidentStatus, RoomStatus } from "@prisma/client"
import { Search, X, AlertCircle, Loader2, Users, CheckCircle2, UserX, DoorOpen, Upload, Download, Printer, FileText, User, Trash2, Filter, CheckSquare, MoveRight } from "lucide-react"
import * as XLSX from "xlsx"
import ResidentDetailModal from "./ResidentDetailModal"
import SantriWizard from "@/components/dashboard/santri/wizard/SantriWizard"
import { CldImage } from "next-cloudinary"

interface Room {
  id: string
  number: string
  capacity: number
  status: RoomStatus
  residents: { id: string }[]
}

interface Resident {
  id: string
  name: string
  nim: string | null
  niup: string | null
  angkatan: string | null
  nik?: string | null
  wilayah: string | null
  daerah: string | null
  prodi: string | null
  kotaAsal: string | null
  fakultas: string | null
  phone: string | null
  roomId: string | null
  status: ResidentStatus
  room: {
    id: string
    number: string
  } | null
  photo?: string | null
  tempatLahir?: string | null
  tanggalLahir?: string | Date | null
  gender?: string | null
  createdAt?: string | Date | null
  assignments?: {
    id: string
    position: string
    satker: { name: string }
  }[]
}

type DaerahNode = { id: string, name: string, rooms: Room[] }
type WilayahNode = { id: string, name: string, daerahs: DaerahNode[] }

const importHeaders = [
  "Nama Lengkap (Wajib ada)",
  "NIM (opsional)",
  "NIUP (opsional)",
  "NIK (opsional)",
  "Jenis Kelamin (Wajib ada)",
  "Tempat Lahir (Wajib ada)",
  "Tanggal Lahir (YYYY-MM-DD) (Wajib ada)",
  "Nomor Telepon (opsional)",
  "Fakultas (opsional)",
  "Program Studi (Wajib ada)",
  "Angkatan (Wajib ada)",
  "Wilayah (opsional)",
  "Daerah (opsional)",
  "Kamar (opsional)",
  "Alamat Lengkap (opsional)",
  "Kota Asal (opsional)",
  "Kode Pos (opsional)",
]

function readExcelCell(row: Record<string, string | number | undefined>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim()
    }
  }
  return ""
}

function hasRequiredImportData(row: {
  name: string | number
  gender?: string | number | null
  tempatLahir?: string | number | null
  tanggalLahir?: string | number | Date | null
  prodi?: string | number | null
  angkatan?: string | number | null
}) {
  return Boolean(
    String(row.name || "").trim() &&
    String(row.gender || "").trim() &&
    String(row.tempatLahir || "").trim() &&
    row.tanggalLahir &&
    String(row.prodi || "").trim() &&
    String(row.angkatan || "").trim()
  )
}

export default function ResidentsClient({
  initialResidents,
  areaHierarchy,
  fakultasOptions,
  prodiOptions,
  angkatanOptions,
  permissions = []
}: {
  initialResidents: Resident[]
  areaHierarchy: WilayahNode[]
  fakultasOptions: {id: string, name: string}[]
  prodiOptions: {id: string, name: string, fakultasId: string}[]
  angkatanOptions: {id: string, name: string, prodiId: string}[]
  permissions?: string[]
}) {
  const rooms = areaHierarchy.flatMap(w => w.daerahs.flatMap(d => d.rooms))
  const [residents, setResidents] = useState<Resident[]>(initialResidents)
  const [search, setSearch] = useState("")
  const [showFilter, setShowFilter] = useState(false)
  const [isSelectionActive, setIsSelectionActive] = useState(false)
  
  const [filterWilayah, setFilterWilayah] = useState("")
  const [filterProdi, setFilterProdi] = useState("")
  const [filterAngkatan, setFilterAngkatan] = useState("")
  const [filterKamar, setFilterKamar] = useState("")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
  const [viewingResident, setViewingResident] = useState<Resident | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [moveRoomId, setMoveRoomId] = useState("")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = (filteredRes: Resident[]) => {
    const allFilteredIds = filteredRes.map(r => r.id)
    const allSelected = allFilteredIds.every(id => selectedIds.has(id))

    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        allFilteredIds.forEach(id => next.delete(id))
      } else {
        allFilteredIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.size} santri terpilih?`)) return

    startTransition(async () => {
      const idsArray = Array.from(selectedIds)
      const res = await bulkDeleteResidents(idsArray)
      if (res.error) {
        alert(res.error)
      } else {
        setResidents(prev => prev.filter(r => !selectedIds.has(r.id)))
        setSelectedIds(new Set())
      }
    })
  }

  const handleBulkMove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIds.size === 0) return

    startTransition(async () => {
      const idsArray = Array.from(selectedIds)
      const res = await bulkMoveResidents(idsArray, { roomId: moveRoomId })
      
      if (res.error) {
        setError(res.error)
      } else {
        setIsMoveModalOpen(false)
        setSelectedIds(new Set())
        alert("Berhasil memindahkan santri.")
        window.location.reload()
      }
    })
  }

  const toggleSelectionMode = () => {
    setIsSelectionActive(!isSelectionActive)
    if (isSelectionActive) {
      setSelectedIds(new Set())
    }
  }

  const toggleFilter = () => {
    setShowFilter(!showFilter)
    if (showFilter) {
      setFilterWilayah("")
      setFilterProdi("")
      setFilterAngkatan("")
      setFilterKamar("")
    }
  }

  // Stats
  const totalResidents = residents.length
  const activeResidents = residents.filter(r => r.status === ResidentStatus.ACTIVE).length
  const inactiveResidents = residents.filter(r => r.status === ResidentStatus.INACTIVE).length

  // Unique filter options
  const uniqueWilayah = Array.from(new Set(residents.map(r => r.wilayah).filter(Boolean))).sort() as string[]
  const uniqueProdi = Array.from(new Set(residents.map(r => r.prodi).filter(Boolean))).sort() as string[]
  const uniqueAngkatan = Array.from(new Set(residents.map(r => r.angkatan).filter(Boolean))).sort() as string[]
  const uniqueKamar = Array.from(new Set(residents.map(r => r.room?.number).filter(Boolean))).sort((a, b) => {
    const numA = parseInt(a as string, 10);
    const numB = parseInt(b as string, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a as string).localeCompare(b as string);
  }) as string[]

  // Filtered residents
  const filteredResidents = residents.filter(res => {
    const matchSearch = 
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      (res.nim && res.nim.includes(search)) ||
      (res.niup && res.niup.includes(search))

    const matchWilayah = filterWilayah ? res.wilayah === filterWilayah : true
    const matchProdi = filterProdi ? res.prodi === filterProdi : true
    const matchAngkatan = filterAngkatan ? res.angkatan === filterAngkatan : true
    const matchKamar = filterKamar ? res.room?.number === filterKamar : true

    return matchSearch && matchWilayah && matchProdi && matchAngkatan && matchKamar
  })

  // Filter rooms that have slot availability OR is the room currently assigned to this resident
  const availableRooms = rooms.filter(room => {
    const hasCapacity = room.residents.length < room.capacity
    const isAvailable = room.status === RoomStatus.AVAILABLE
    const isCurrentRoom = editingResident && editingResident.roomId === room.id
    return (isAvailable && hasCapacity) || isCurrentRoom
  })

  // Cascading options






  const exportToCSV = () => {
    const headers = ["No", "NIM", "NIUP", "Nama Lengkap", "Wilayah", "Kamar", "Prodi", "Angkatan", "Nomor Telepon", "Status"]
    const rows = residents.map((res, idx) => [
      String(idx + 1),
      res.nim || "-",
      res.niup || "-",
      res.name,
      res.wilayah || "-",
      res.room ? `Kamar ${res.room.number}` : "Belum Ada Kamar",
      res.prodi || "-",
      res.angkatan || "-",
      res.phone || "-",
      res.status === ResidentStatus.ACTIVE ? "Aktif" : "Alumni"
    ])

    // Generate CSV content using BOM for proper Excel utf-8 encoding support
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Data_Santri_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      importHeaders,
      ["Ahmad Santoso", "", "NP-2026-0001", "3578000000000001", "LAKI_LAKI", "Surabaya", "2000-01-01", "08123456789", "Ilmu Komputer", "Teknik Informatika", "2021", "Al-Ghazali", "Blok A", "A1", "Jl. Mawar No.1", "Surabaya", "60111"],
      ["Siti Aminah", "", "", "3578000000000002", "PEREMPUAN", "Malang", "2001-02-02", "", "", "Sistem Informasi", "2022", "", "", "", "Jl. Melati No.2", "Malang", "65112"]
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template Import")
    XLSX.writeFile(wb, "Template_Import_Santri.xlsx")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError("")

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<Record<string, string | number | undefined>>(ws)

        const formattedData = data.map((row) => ({
          name: readExcelCell(row, ["Nama Lengkap (Wajib ada)", "Nama Lengkap", "Nama", "name"]),
          nim: readExcelCell(row, ["NIM (opsional)", "NIM", "nim", "Nim"]),
          niup: readExcelCell(row, ["NIUP (opsional)", "NIUP", "niup", "Niup"]) || null,
          nik: readExcelCell(row, ["NIK (opsional)", "NIK", "nik", "Nik"]) || null,
          gender: readExcelCell(row, ["Jenis Kelamin (Wajib ada)", "Jenis Kelamin", "Gender", "gender"]) || null,
          tempatLahir: readExcelCell(row, ["Tempat Lahir (Wajib ada)", "Tempat Lahir", "tempatLahir"]) || null,
          tanggalLahir: readExcelCell(row, ["Tanggal Lahir (YYYY-MM-DD) (Wajib ada)", "Tanggal Lahir (YYYY-MM-DD)", "Tanggal Lahir", "tanggalLahir"]) || null,
          phone: readExcelCell(row, ["Nomor Telepon (opsional)", "Nomor Telepon", "phone", "No Telp"]),
          fakultas: readExcelCell(row, ["Fakultas (opsional)", "Fakultas", "fakultas"]),
          prodi: readExcelCell(row, ["Program Studi (Wajib ada)", "Program Studi", "Prodi", "prodi"]),
          angkatan: readExcelCell(row, ["Angkatan (Wajib ada)", "Angkatan", "angkatan"]),
          wilayah: readExcelCell(row, ["Wilayah (opsional)", "Wilayah", "wilayah"]),
          daerah: readExcelCell(row, ["Daerah (opsional)", "Daerah", "daerah"]),
          roomNumber: readExcelCell(row, ["Kamar (opsional)", "Kamar", "room"]),
          alamatLengkap: readExcelCell(row, ["Alamat Lengkap (opsional)", "Alamat Lengkap", "Alamat", "alamatLengkap"]) || undefined,
          kotaAsal: readExcelCell(row, ["Kota Asal (opsional)", "Kota Asal", "kotaAsal"]) || undefined,
          kodePos: readExcelCell(row, ["Kode Pos (opsional)", "Kode Pos", "KodePos", "kodePos"]) || undefined
        })).filter(hasRequiredImportData)

        if (formattedData.length === 0) {
          setError("Format file Excel tidak valid atau kosong. Pastikan kolom wajib terisi: Nama Lengkap, Jenis Kelamin, Tempat Lahir, Tanggal Lahir, Program Studi, dan Angkatan.")
          setImporting(false)
          return
        }

        startTransition(async () => {
          const res = await bulkCreateResidents(formattedData as Parameters<typeof bulkCreateResidents>[0])
          if (res.error) {
            setError(res.error)
          } else {
            alert(`Berhasil impor ${res.successCount} santri. ${res.skippedCount} santri dilewati karena data wajib kosong atau NIM/NIUP duplikat. Halaman akan dimuat ulang.`)
            window.location.reload()
          }
          setImporting(false)
        })
      } catch {
        setError("Gagal memproses file Excel.")
        setImporting(false)
      }
    }
    reader.readAsBinaryString(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const printPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Daftar Santri - DormiSync</title>
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
            .badge-active { background-color: #d1fae5; color: #065f46; }
            .badge-inactive { background-color: #f3f4f6; color: #374151; }
            .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN DAFTAR SANTRI ASRAMA</h1>
            <p>Sistem Informasi Manajemen Asrama DormiSync • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NIM</th>
                <th>NIUP</th>
                <th>Nama Lengkap</th>
                <th>Wilayah</th>
                <th>Kamar</th>
                <th>Prodi</th>
                <th>Angkatan</th>
                <th>Nomor Telepon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${residents.map((res, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${res.nim || "-"}</td>
                  <td>${res.niup || "-"}</td>
                  <td style="font-weight: 600;">${res.name}</td>
                  <td>${res.wilayah || "-"}</td>
                  <td>${res.room ? `Kamar ${res.room.number}` : "Belum Ada Kamar"}</td>
                  <td>${res.prodi || "-"}</td>
                  <td>${res.angkatan || "-"}</td>
                  <td>${res.phone || "-"}</td>
                  <td>
                    <span class="badge ${res.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
                      ${res.status === 'ACTIVE' ? 'Aktif' : 'Alumni'}
                    </span>
                  </td>
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Direktori Santri</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Daftarkan santri baru, kelola detail kamar, dan pantau database santri.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={downloadTemplate}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all tooltip-trigger relative group flex items-center justify-center"
              title="Unduh Template Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="p-2 text-zinc-500 hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
              title="Import Data Excel"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </button>
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            <button
              onClick={exportToCSV}
              className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all flex items-center justify-center"
              title="Ekspor Data ke CSV"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={printPDF}
              className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"
              title="Cetak Laporan (PDF)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={toggleSelectionMode}
            className={`border ${isSelectionActive ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'} rounded-xl py-2.5 px-4 font-semibold shadow-sm flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isSelectionActive ? "Nonaktifkan Memilih" : "Aktifkan Memilih"}</span>
          </button>

          {isSelectionActive && selectedIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setError("")
                  setIsMoveModalOpen(true)
                }}
                className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl py-2.5 px-4 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer"
              >
                <MoveRight className="w-4 h-4" />
                <span className="hidden sm:inline">Pindah Kamar</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-650 hover:bg-red-600 text-white rounded-xl py-2.5 px-4 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            </div>
          )}


        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-zinc-200/55 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Santri</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalResidents}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Santri Aktif</p>
            <h3 className="text-2xl font-bold text-emerald-655 dark:text-emerald-400">{activeResidents}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-red-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Alumni / Tidak Aktif</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{inactiveResidents}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
        <div className="flex-1 w-full flex items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Cari nama santri atau NIM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-800 dark:text-white placeholder-zinc-450 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            />
          </div>
          <button
            onClick={toggleFilter}
            className={`p-2 rounded-lg transition-all flex items-center space-x-2 text-sm font-medium ${showFilter ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">
            Total data: <span className="font-bold text-zinc-900 dark:text-white">{filteredResidents.length}</span>
          </span>
          {(filterWilayah || filterProdi || filterAngkatan || filterKamar || search) && (
            <button
              onClick={() => {
                setFilterWilayah("")
                setFilterProdi("")
                setFilterAngkatan("")
                setFilterKamar("")
                setSearch("")
              }}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilter && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filterWilayah}
              onChange={(e) => setFilterWilayah(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
            >
              <option value="">Semua Wilayah</option>
              {uniqueWilayah.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
            >
              <option value="">Semua Prodi</option>
              {uniqueProdi.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              value={filterAngkatan}
              onChange={(e) => setFilterAngkatan(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
            >
              <option value="">Semua Angkatan</option>
              {uniqueAngkatan.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              value={filterKamar}
              onChange={(e) => setFilterKamar(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none"
            >
              <option value="">Semua Kamar</option>
              {uniqueKamar.map(k => <option key={k} value={k}>Kamar {k}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Residents Table */}
      {filteredResidents.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
          Tidak ada data santri yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">
                  {isSelectionActive && (
                    <th className="py-4 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={filteredResidents.length > 0 && filteredResidents.every(r => selectedIds.has(r.id))}
                        onChange={() => handleSelectAll(filteredResidents)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-primary-600 cursor-pointer"
                        title="Pilih Semua"
                      />
                    </th>
                  )}
                  <th className="py-4 px-4">No</th>
                  <th className="py-4 px-4">NIM</th>
                  <th className="py-4 px-4">Nama</th>
                  <th className="py-4 px-4">Kamar</th>
                  <th className="py-4 px-4">Daerah</th>
                  <th className="py-4 px-4">Wilayah</th>
                  <th className="py-4 px-4">Kota Asal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-300">
                {filteredResidents.map((res, index) => (
                  <tr
                    key={res.id}
                    onClick={() => setViewingResident(res)}
                    className={`transition-all cursor-pointer ${
                      isSelectionActive && selectedIds.has(res.id)
                        ? "bg-primary-500/5 dark:bg-primary-500/10 border-l-2 border-primary-500"
                        : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-l-2 border-transparent"
                    }`}
                  >
                    {isSelectionActive && (
                      <td className="py-4 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(res.id)}
                          onChange={() => handleSelectToggle(res.id)}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 accent-primary-600 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400 text-xs">{index + 1}</td>
                    <td className="py-4 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">{res.nim || "-"}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                          {res.photo ? (
                            <CldImage src={res.photo} alt={res.name} width={32} height={32} crop="fill" gravity="face" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white">{res.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {res.room ? (
                        <span className="flex items-center space-x-1.5 text-primary-600 dark:text-primary-400 font-bold">
                          <DoorOpen className="w-4 h-4 text-primary-500/70" />
                          <span>{res.room.number}</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1 text-xs font-semibold">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-zinc-600 dark:text-zinc-300 text-sm">{res.daerah || <span className="text-zinc-400 dark:text-zinc-650">-</span>}</td>
                    <td className="py-4 px-4 text-zinc-600 dark:text-zinc-300 text-sm">{res.wilayah || <span className="text-zinc-400 dark:text-zinc-650">-</span>}</td>
                    <td className="py-4 px-4 text-zinc-600 dark:text-zinc-300 text-sm">{res.kotaAsal || <span className="text-zinc-400 dark:text-zinc-650">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal Pindah Asrama/Kamar */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMoveModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-[24px] border border-zinc-200 dark:border-zinc-800/80 overflow-hidden relative z-10 p-6 md:p-8 space-y-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300">
                  Pindah Asrama / Kamar
                </h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-0.5">
                  Memindahkan {selectedIds.size} santri terpilih.
                </p>
              </div>
              <button 
                onClick={() => setIsMoveModalOpen(false)} 
                className="text-zinc-450 dark:text-zinc-500 hover:text-zinc-850 dark:hover:text-white p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBulkMove} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-440 uppercase tracking-wider block mb-1.5">Kamar Baru</label>
                <div className="relative">
                  <DoorOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 z-10" />
                  <select
                    value={moveRoomId}
                    onChange={(e) => setMoveRoomId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Kamar</option>
                    {availableRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        Kamar {room.number} (Terisi: {room.residents.length}/{room.capacity})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !moveRoomId}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md shadow-primary-500/20"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Memproses...</span></>
                  ) : (
                    <span>Pindahkan Santri</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog Form - SantriWizard */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="min-h-screen px-4 py-10">
            <div className="max-w-4xl mx-auto relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute -top-8 right-0 text-white/70 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <SantriWizard
                mode={editingResident ? "edit" : "create"}
                residentId={editingResident?.id}
                initialData={editingResident || undefined}
                onCancel={() => setIsModalOpen(false)}
                areaHierarchy={areaHierarchy}
                fakultasOptions={fakultasOptions}
                prodiOptions={prodiOptions}
                angkatanOptions={angkatanOptions}
              />
            </div>
          </div>
        </div>
      )}

      <ResidentDetailModal
        isOpen={viewingResident !== null}
        onClose={() => setViewingResident(null)}
        resident={viewingResident}
        onEdit={() => {
          if (viewingResident) {
            setEditingResident(viewingResident)
            setIsModalOpen(true)
          }
          setViewingResident(null)
        }}
        permissions={permissions}
      />
    </div>
  )
}
