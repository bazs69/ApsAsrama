"use client"

import { useState, useTransition } from "react"
import {
  createSatker,
  updateSatker,
  deleteSatker,
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
  Users,
  CheckCircle2,
  Phone,
  Briefcase,
  Calendar,
  Trash2,
  ShieldCheck,
  UserCheck,
  ClipboardList
} from "lucide-react"

interface Resident {
  id: string
  name: string
  nim: string
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
    nim: string
  }
  satker: {
    id: string
    name: string
    picName: string
    picPhone: string | null
  }
}

export default function AssignmentsClient({
  initialAssignments,
  initialSatkers,
  residents,
}: {
  initialAssignments: Assignment[]
  initialSatkers: Satker[]
  residents: Resident[]
}) {
  const [activeTab, setActiveTab] = useState<"assignments" | "satkers">("assignments")
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [satkers, setSatkers] = useState<Satker[]>(initialSatkers)
  const [searchQuery, setSearchQuery] = useState("")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Modals state
  const [isSatkerModalOpen, setIsSatkerModalOpen] = useState(false)
  const [editingSatker, setEditingSatker] = useState<Satker | null>(null)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)

  // Satker Form Fields
  const [satkerName, setSatkerName] = useState("")
  const [satkerPicName, setSatkerPicName] = useState("")
  const [satkerPicPhone, setSatkerPicPhone] = useState("")

  // Assignment Form Fields
  const [assignResidentId, setAssignResidentId] = useState("")
  const [assignSatkerId, setAssignSatkerId] = useState("")
  const [assignPosition, setAssignPosition] = useState("Anggota")
  const [assignStatus, setAssignStatus] = useState("ACTIVE")
  const [assignStartDate, setAssignStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [assignEndDate, setAssignEndDate] = useState("")

  // Filters & Stats
  const activeAssignments = assignments.filter((a) => a.status === "ACTIVE")
  const completedAssignments = assignments.filter((a) => a.status === "COMPLETED")

  const filteredAssignments = assignments.filter((a) =>
    a.resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.resident.nim.includes(searchQuery) ||
    a.satker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.position.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSatkers = satkers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.picName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handlers for Satker
  const openAddSatkerModal = () => {
    setEditingSatker(null)
    setSatkerName("")
    setSatkerPicName("")
    setSatkerPicPhone("")
    setError("")
    setIsSatkerModalOpen(true)
  }

  const openEditSatkerModal = (s: Satker) => {
    setEditingSatker(s)
    setSatkerName(s.name)
    setSatkerPicName(s.picName)
    setSatkerPicPhone(s.picPhone || "")
    setError("")
    setIsSatkerModalOpen(true)
  }

  const handleSaveSatker = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      let res
      if (editingSatker) {
        res = await updateSatker(editingSatker.id, {
          name: satkerName,
          picName: satkerPicName,
          picPhone: satkerPicPhone,
        })
      } else {
        res = await createSatker({
          name: satkerName,
          picName: satkerPicName,
          picPhone: satkerPicPhone,
        })
      }

      if (res.error) {
        setError(res.error)
      } else if (res.success && res.satker) {
        if (editingSatker) {
          setSatkers((prev) =>
            prev.map((s) =>
              s.id === editingSatker.id
                ? {
                    ...s,
                    name: satkerName,
                    picName: satkerPicName,
                    picPhone: satkerPicPhone || null,
                  }
                : s
            )
          )
        } else {
          setSatkers((prev) =>
            [
              ...prev,
              {
                ...res.satker,
                assignments: [],
              } as Satker,
            ].sort((a, b) => a.name.localeCompare(b.name))
          )
        }
        setIsSatkerModalOpen(false)
      }
    })
  }

  const handleDeleteSatker = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus Satker "${name}"? Semua data penugasan yang terkait dengan satker ini juga akan dihapus.`
      )
    )
      return

    const res = await deleteSatker(id)
    if (res.error) {
      alert(res.error)
    } else {
      setSatkers((prev) => prev.filter((s) => s.id !== id))
      setAssignments((prev) => prev.filter((a) => a.satkerId !== id))
    }
  }

  // Handlers for Assignment
  const openAddAssignmentModal = () => {
    setEditingAssignment(null)
    setAssignResidentId("")
    setAssignSatkerId("")
    setAssignPosition("Anggota")
    setAssignStatus("ACTIVE")
    setAssignStartDate(new Date().toISOString().split("T")[0])
    setAssignEndDate("")
    setError("")
    setIsAssignmentModalOpen(true)
  }

  const openEditAssignmentModal = (a: Assignment) => {
    setEditingAssignment(a)
    setAssignResidentId(a.residentId)
    setAssignSatkerId(a.satkerId)
    setAssignPosition(a.position)
    setAssignStatus(a.status)
    setAssignStartDate(
      new Date(a.startDate).toISOString().split("T")[0]
    )
    setAssignEndDate(
      a.endDate ? new Date(a.endDate).toISOString().split("T")[0] : ""
    )
    setError("")
    setIsAssignmentModalOpen(true)
  }

  const handleSaveAssignment = async (e: React.FormEvent) => {
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
            prev.map((a) =>
              a.id === editingAssignment.id ? fullAssignment : a
            )
          )
        } else {
          setAssignments((prev) => [fullAssignment, ...prev])
          // Increment assignment count inside local satker list
          setSatkers((prev) =>
            prev.map((s) =>
              s.id === assignSatkerId
                ? { ...s, assignments: [...s.assignments, { id: res.assignment.id }] }
                : s
            )
          )
        }
        setIsAssignmentModalOpen(false)
      }
    })
  }

  const handleDeleteAssignment = async (id: string, residentName: string, satkerName: string) => {
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
      const assignmentToDelete = assignments.find((a) => a.id === id)
      setAssignments((prev) => prev.filter((a) => a.id !== id))
      if (assignmentToDelete) {
        // Decrement assignment count inside local satker list
        setSatkers((prev) =>
          prev.map((s) =>
            s.id === assignmentToDelete.satkerId
              ? { ...s, assignments: s.assignments.filter((a) => a.id !== id) }
              : s
          )
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Manajemen Penugasan Santri
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">
            Tempatkan santri di unit kerja (Satker) yang sesuai dan kelola Penanggung Jawab unit tersebut.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "assignments" ? (
            <button
              onClick={openAddAssignmentModal}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 px-5 font-semibold shadow-lg shadow-primary-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Penugasan Santri</span>
            </button>
          ) : (
            <button
              onClick={openAddSatkerModal}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl py-3 px-5 font-semibold shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah Satker Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout Button */}
      <div className="flex space-x-2 p-1 bg-zinc-150 dark:bg-zinc-900/60 rounded-xl max-w-md border border-zinc-200/40 dark:border-zinc-800/40 shadow-inner">
        <button
          onClick={() => {
            setActiveTab("assignments")
            setSearchQuery("")
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === "assignments"
              ? "bg-white dark:bg-zinc-800 text-primary-600 dark:text-primary-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Penugasan Santri</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("satkers")
            setSearchQuery("")
          }}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            activeTab === "satkers"
              ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Satuan Kerja (Satker)</span>
        </button>
      </div>

      {/* Stats Section based on active tab */}
      {activeTab === "assignments" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-5 border border-zinc-200/55 dark:border-zinc-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Penugasan</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {assignments.length}
              </h3>
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5 border border-zinc-200/55 dark:border-zinc-800 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Satuan Kerja (Satker)</p>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {satkers.length}
              </h3>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Satker Dengan Penanggung Jawab</p>
              <h3 className="text-2xl font-bold text-emerald-655 dark:text-emerald-400">
                {satkers.filter((s) => s.picName).length}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
        <input
          type="text"
          placeholder={
            activeTab === "assignments"
              ? "Cari nama santri, NIM, satker, jabatan..."
              : "Cari nama satuan kerja, penanggung jawab..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Content Lists */}
      {activeTab === "assignments" ? (
        filteredAssignments.length === 0 ? (
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
                        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-450 mt-0.5">{a.resident.nim}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                          <Briefcase className="w-4 h-4 text-emerald-500/80" />
                          <span>{a.satker.name}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">PJ: {a.satker.picName}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          a.position.toLowerCase() === "ketua"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : a.position.toLowerCase() === "sekretaris" || a.position.toLowerCase() === "bendahara"
                            ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-750 dark:text-zinc-450 border border-zinc-200 dark:border-zinc-700/50"
                        }`}>
                          {a.position}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs space-y-1">
                        <div className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Mulai: {new Date(a.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {a.endDate && (
                          <div className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-450">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Selesai: {new Date(a.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          a.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-450 border border-emerald-500/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700/50"
                        }`}>
                          {a.status === "ACTIVE" ? "Aktif" : "Selesai"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openEditAssignmentModal(a)}
                          className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-block cursor-pointer"
                          title="Edit Penugasan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(a.id, a.resident.name, a.satker.name)}
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
        )
      ) : filteredSatkers.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500 flex flex-col items-center justify-center space-y-3">
          <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
          <p className="font-semibold text-zinc-750 dark:text-zinc-300">Belum Ada Satuan Kerja (Satker)</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            Belum ada Satuan Kerja yang terdaftar. Tambahkan Satker baru untuk mulai menata manajemen struktural asrama Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSatkers.map((s) => (
            <div
              key={s.id}
              className="glass rounded-2xl border border-zinc-200/70 dark:border-zinc-800/80 p-5 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-none dark:hover:border-zinc-700/60 transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-650 dark:text-emerald-450 rounded-full px-3 py-1 text-xs font-bold flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{s.assignments.filter((a) => {
                      const ass = assignments.find((f) => f.id === a.id)
                      return ass && ass.status === "ACTIVE"
                    }).length} Aktif</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{s.name}</h3>
                  <div className="flex items-center space-x-1.5 text-zinc-550 dark:text-zinc-400 text-sm mt-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
                    <span className="font-medium">PJ: {s.picName}</span>
                  </div>
                  {s.picPhone ? (
                    <div className="flex items-center space-x-1.5 text-zinc-500 dark:text-zinc-450 text-xs mt-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{s.picPhone}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 mt-1 italic">Tidak ada nomor kontak PJ</div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-150 dark:border-zinc-850">
                <button
                  onClick={() => openEditSatkerModal(s)}
                  className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit Satker"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSatker(s.id, s.name)}
                  className="p-1.5 text-zinc-550 hover:text-red-655 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Satker"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Satker Modal */}
      {isSatkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSatkerModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingSatker ? "Edit Satuan Kerja (Satker)" : "Tambah Satker Baru"}
              </h2>
              <button
                onClick={() => setIsSatkerModalOpen(false)}
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

            <form onSubmit={handleSaveSatker} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Nama Satuan Kerja (Satker)
                </label>
                <input
                  type="text"
                  required
                  value={satkerName}
                  onChange={(e) => setSatkerName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Contoh: Kebersihan Lingkungan, Koperasi Santri"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Nama Penanggung Jawab (PIC / Koordinator)
                </label>
                <input
                  type="text"
                  required
                  value={satkerPicName}
                  onChange={(e) => setSatkerPicName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Contoh: Ust. Ahmad Fauzi"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Nomor Kontak PJ (Opsional)
                </label>
                <input
                  type="text"
                  value={satkerPicPhone}
                  onChange={(e) => setSatkerPicPhone(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Contoh: 081234567890"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{editingSatker ? "Simpan Perubahan" : "Simpan Satker Baru"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAssignmentModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingAssignment ? "Edit Detail Penugasan" : "Tambah Penugasan Santri"}
              </h2>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
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

            <form onSubmit={handleSaveAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Pilih Santri
                </label>
                {editingAssignment ? (
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-500 dark:text-zinc-400 font-semibold">
                    {editingAssignment.resident.name} ({editingAssignment.resident.nim})
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
                        {r.name} ({r.nim})
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
