"use client"

import { useState, useTransition } from "react"
import {
  createSatker,
  updateSatker,
  deleteSatker,
} from "@/app/actions/assignments"
import {
  Plus,
  Search,
  Edit2,
  X,
  AlertCircle,
  Loader2,
  Users,
  Phone,
  Briefcase,
  Trash2,
  ShieldCheck,
} from "lucide-react"

interface Satker {
  id: string
  name: string
  picName: string
  picPhone: string | null
  assignments: { id: string; status?: string }[]
}

export default function SatkerListClient({
  initialSatkers,
}: {
  initialSatkers: Satker[]
}) {
  const [satkers, setSatkers] = useState<Satker[]>(initialSatkers)
  const [searchQuery, setSearchQuery] = useState("")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSatker, setEditingSatker] = useState<Satker | null>(null)

  const [satkerName, setSatkerName] = useState("")
  const [satkerPicName, setSatkerPicName] = useState("")
  const [satkerPicPhone, setSatkerPicPhone] = useState("")

  const filteredSatkers = satkers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.picName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openAddModal = () => {
    setEditingSatker(null)
    setSatkerName("")
    setSatkerPicName("")
    setSatkerPicPhone("")
    setError("")
    setIsModalOpen(true)
  }

  const openEditModal = (s: Satker) => {
    setEditingSatker(s)
    setSatkerName(s.name)
    setSatkerPicName(s.picName)
    setSatkerPicPhone(s.picPhone || "")
    setError("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
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
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus Satker "${name}"? Semua data penugasan yang terkait juga akan dihapus.`
      )
    )
      return

    const res = await deleteSatker(id)
    if (res.error) {
      alert(res.error)
    } else {
      setSatkers((prev) => prev.filter((s) => s.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Satuan Kerja (Satker)
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">
            Kelola unit kerja dan penanggung jawab di lingkungan asrama.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl py-3 px-5 font-semibold shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Satker Baru</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 border border-zinc-200/55 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Satuan Kerja</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{satkers.length}</h3>
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

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari nama satuan kerja, penanggung jawab..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Satker Grid */}
      {filteredSatkers.length === 0 ? (
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
                    <span>{s.assignments.length} Anggota</span>
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
                  onClick={() => openEditModal(s)}
                  className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-450 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit Satker"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id, s.name)}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingSatker ? "Edit Satuan Kerja (Satker)" : "Tambah Satker Baru"}
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
    </div>
  )
}
