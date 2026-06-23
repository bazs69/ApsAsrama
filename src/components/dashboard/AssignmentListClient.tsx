"use client"

import { useState, useTransition } from "react"
import {
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "@/app/actions/assignments"
import {
  Plus,
  Search,
  Edit2,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar,
  Briefcase,
  Trash2,
  UserCheck,
  ClipboardList,
} from "lucide-react"

interface Resident {
  id: string
  name: string
  nim: string | null
  status: string
}

interface Satker {
  id: string
  name: string
  picName: string
  picPhone: string | null
  assignments: { id: string }[]
}

interface Assignment {
  id: string
  residentId: string
  satkerId: string
  position: string
  status: string
  startDate: string | Date
  endDate: string | Date | null
  resident: {
    id: string
    name: string
    nim: string | null
  }
  satker: {
    id: string
    name: string
    picName: string
    picPhone: string | null
  }
}

export default function AssignmentListClient({
  initialAssignments,
  initialSatkers,
  residents,
}: {
  initialAssignments: Assignment[]
  initialSatkers: Satker[]
  residents: Resident[]
}) {
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [satkers] = useState<Satker[]>(initialSatkers)
  const [searchQuery, setSearchQuery] = useState("")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)

  const [assignResidentId, setAssignResidentId] = useState("")
  const [assignSatkerId, setAssignSatkerId] = useState("")
  const [assignPosition, setAssignPosition] = useState("Anggota")
  const [assignStatus, setAssignStatus] = useState("ACTIVE")
  const [assignStartDate, setAssignStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [assignEndDate, setAssignEndDate] = useState("")

  const activeAssignments = assignments.filter((a) => a.status === "ACTIVE")
  const completedAssignments = assignments.filter((a) => a.status === "COMPLETED")

  const filteredAssignments = assignments.filter(
    (a) =>
      a.resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.resident.nim || "").includes(searchQuery) ||
      a.satker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openAddModal = () => {
    setEditingAssignment(null)
    setAssignResidentId("")
    setAssignSatkerId("")
    setAssignPosition("Anggota")
    setAssignStatus("ACTIVE")
    setAssignStartDate(new Date().toISOString().split("T")[0])
    setAssignEndDate("")
    setError("")
    setIsModalOpen(true)
  }

  const openEditModal = (a: Assignment) => {
    setEditingAssignment(a)
    setAssignResidentId(a.residentId)
    setAssignSatkerId(a.satkerId)
    setAssignPosition(a.position)
    setAssignStatus(a.status)
    setAssignStartDate(new Date(a.startDate).toISOString().split("T")[0])
    setAssignEndDate(a.endDate ? new Date(a.endDate).toISOString().split("T")[0] : "")
    setError("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!assignResidentId) {
      setError("Silakan pilih santri.")
      return
    }
    if (!assignSatkerId) {
      setError("Silakan pilih satuan kerja.")
      return
    }

    startTransition(async () => {
      let res
      const payload = {
        residentId: assignResidentId,
        satkerId: assignSatkerId,
        position: assignPosition,
        status: assignStatus,
        startDate: assignStartDate,
        endDate: assignEndDate || undefined,
      }

      if (editingAssignment) {
        res = await updateAssignment(editingAssignment.id, payload)
      } else {
        res = await createAssignment(payload)
      }

      if (res.error) {
        setError(res.error)
      } else if (res.success && res.assignment) {
        const selectedResident = residents.find((r) => r.id === assignResidentId)
        const selectedSatker = satkers.find((s) => s.id === assignSatkerId)

        const fullAssignment: Assignment = {
          ...res.assignment,
          resident: {
            id: selectedResident?.id || "",
            name: selectedResident?.name || "",
            nim: selectedResident?.nim || "",
          },
          satker: {
            id: selectedSatker?.id || "",
            name: selectedSatker?.name || "",
            picName: selectedSatker?.picName || "",
            picPhone: selectedSatker?.picPhone || null,
          },
        }

        if (editingAssignment) {
          setAssignments((prev) =>
            prev.map((a) => (a.id === editingAssignment.id ? fullAssignment : a))
          )
        } else {
          setAssignments((prev) => [fullAssignment, ...prev])
        }
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = async (id: string, residentName: string, satkerName: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin membatalkan/menghapus penugasan "${residentName}" di Satker "${satkerName}"?`
      )
    )
      return

    const res = await deleteAssignment(id)
    if (res.error) {
      alert(res.error)
    } else {
      setAssignments((prev) => prev.filter((a) => a.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Penugasan Santri
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">
            Tempatkan santri di unit kerja (Satker) yang sesuai.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 px-5 font-semibold shadow-lg shadow-primary-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Penugasan Santri</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-zinc-200/55 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Penugasan</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{assignments.length}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-primary-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-650 dark:text-primary-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Tugas Aktif</p>
            <h3 className="text-2xl font-bold text-primary-650 dark:text-primary-450">
              {activeAssignments.length}
            </h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Tugas Selesai</p>
            <h3 className="text-2xl font-bold text-emerald-655 dark:text-emerald-400">
              {completedAssignments.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari nama santri, NIM, satker, jabatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Table */}
      {filteredAssignments.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500 flex flex-col items-center justify-center space-y-3">
          <ClipboardList className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
          <p className="font-semibold text-zinc-750 dark:text-zinc-300">Belum Ada Data Penugasan</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Tidak ada data penugasan santri yang ditemukan. Klik tombol di kanan atas untuk menugaskan santri pertama Anda.
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">
                  <th className="py-4 px-6">Nama Santri / NIM</th>
                  <th className="py-4 px-6">Satuan Kerja (Satker)</th>
                  <th className="py-4 px-6">Jabatan / Peran</th>
                  <th className="py-4 px-6">Masa Tugas</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-300">
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                    <td className="py-4 px-6">
                      <div className="font-bold text-zinc-900 dark:text-white">{a.resident.name}</div>
                      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">{a.resident.nim || "-"}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                        <Briefcase className="w-4 h-4 text-emerald-500/80" />
                        <span>{a.satker.name}</span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">PJ: {a.satker.picName}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          a.position.toLowerCase() === "ketua"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : a.position.toLowerCase() === "sekretaris" ||
                              a.position.toLowerCase() === "bendahara"
                            ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-700/50"
                        }`}
                      >
                        {a.position}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs space-y-1">
                      <div className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>
                          Mulai:{" "}
                          {new Date(a.startDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {a.endDate && (
                        <div className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-450">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            Selesai:{" "}
                            {new Date(a.endDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          a.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700/50"
                        }`}
                      >
                        {a.status === "ACTIVE" ? "Aktif" : "Selesai"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(a)}
                        className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-block cursor-pointer"
                        title="Edit Penugasan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.resident.name, a.satker.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-650 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-block cursor-pointer"
                        title="Hapus Penugasan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingAssignment ? "Edit Detail Penugasan" : "Tambah Penugasan Santri"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white p-1 cursor-pointer"
              >
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
              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Pilih Santri
                </label>
                {editingAssignment ? (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-500 dark:text-zinc-400 font-semibold">
                    {editingAssignment.resident.name} ({editingAssignment.resident.nim || "-"})
                  </div>
                ) : (
                  <select
                    value={assignResidentId}
                    onChange={(e) => setAssignResidentId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="">-- Pilih Santri --</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.nim || "-"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Pilih Satuan Kerja (Satker)
                </label>
                <select
                  value={assignSatkerId}
                  onChange={(e) => setAssignSatkerId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="">-- Pilih Satker --</option>
                  {satkers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (PJ: {s.picName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Jabatan / Peran
                </label>
                <input
                  type="text"
                  required
                  value={assignPosition}
                  onChange={(e) => setAssignPosition(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Contoh: Anggota, Ketua, Sekretaris"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Mulai Tugas
                  </label>
                  <input
                    type="date"
                    required
                    value={assignStartDate}
                    onChange={(e) => setAssignStartDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Selesai Tugas (Opsional)
                  </label>
                  <input
                    type="date"
                    value={assignEndDate}
                    onChange={(e) => setAssignEndDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Status Tugas
                </label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value="ACTIVE">Aktif (Masih Bertugas)</option>
                  <option value="COMPLETED">Selesai (Sudah Purna Tugas)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{editingAssignment ? "Simpan Perubahan" : "Simpan Penugasan"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
