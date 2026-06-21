"use client"

import { useState, useTransition } from "react"
import { createMuallim, updateMuallim, deleteMuallim } from "@/app/actions/muallim"
import { MuallimStatus } from "@prisma/client"
import { Plus, Search, Edit2, LogOut, X, AlertCircle, Loader2, CheckCircle2, UserX, GraduationCap } from "lucide-react"

interface Muallim {
  id: string
  name: string
  kbm: string
  status: MuallimStatus
}

export default function MuallimClient({
  initialMuallims,
}: {
  initialMuallims: Muallim[]
}) {
  const [muallims, setMuallims] = useState<Muallim[]>(initialMuallims)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMuallim, setEditingMuallim] = useState<Muallim | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [kbm, setKbm] = useState("")
  const [status, setStatus] = useState<MuallimStatus>(MuallimStatus.ACTIVE)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Stats
  const totalMuallims = muallims.length
  const activeMuallims = muallims.filter(m => m.status === MuallimStatus.ACTIVE).length
  const inactiveMuallims = muallims.filter(m => m.status === MuallimStatus.INACTIVE).length

  // Filtered
  const filteredMuallims = muallims.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.kbm.toLowerCase().includes(search.toLowerCase())
  )

  const openAddModal = () => {
    setEditingMuallim(null)
    setName("")
    setKbm("")
    setStatus(MuallimStatus.ACTIVE)
    setError("")
    setIsModalOpen(true)
  }

  const openEditModal = (m: Muallim) => {
    setEditingMuallim(m)
    setName(m.name)
    setKbm(m.kbm)
    setStatus(m.status)
    setError("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      let res
      if (editingMuallim) {
        res = await updateMuallim(editingMuallim.id, { name, kbm, status })
      } else {
        res = await createMuallim({ name, kbm, status })
      }

      if (res.error) {
        setError(res.error)
      } else if (res.success && res.muallim) {
        if (editingMuallim) {
          setMuallims(prev => prev.map(m => m.id === editingMuallim.id ? {
            ...m,
            name,
            kbm,
            status
          } : m))
        } else {
          setMuallims(prev => [...prev, res.muallim as Muallim].sort((a, b) => a.name.localeCompare(b.name)))
        }
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data muallim ini?")) return

    const res = await deleteMuallim(id)
    if (res.error) {
      alert(res.error)
    } else {
      setMuallims(prev => prev.filter(m => m.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Data Muallim</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Kelola data asatidz dan kegiatan belajar mengajar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 px-5 font-semibold shadow-lg shadow-primary-500/25 flex items-center justify-center space-x-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Muallim</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-zinc-200/55 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-550 dark:text-zinc-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Muallim</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalMuallims}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-650 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Muallim Aktif</p>
            <h3 className="text-2xl font-bold text-emerald-655 dark:text-emerald-400">{activeMuallims}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-red-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 dark:text-red-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Tidak Aktif</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{inactiveMuallims}</h3>
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari nama atau KBM..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Table */}
      {filteredMuallims.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
          Tidak ada data muallim yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">
                  <th className="py-4 px-6">Nama Muallim</th>
                  <th className="py-4 px-6">Kegiatan Belajar Mengajar (KBM)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm text-zinc-700 dark:text-zinc-300 transition-colors duration-300">
                {filteredMuallims.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-all">
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">{m.name}</td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">{m.kbm}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        m.status === MuallimStatus.ACTIVE
                          ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/50"
                      }`}>
                        {m.status === MuallimStatus.ACTIVE ? "Aktif" : "Tidak Aktif"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-block"
                        title="Edit Info"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
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
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{editingMuallim ? "Edit Detail Muallim" : "Tambah Muallim Baru"}</h2>
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
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Nama Muallim</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Contoh: Ust. Budi"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Kegiatan Belajar Mengajar (KBM)</label>
                <input
                  type="text"
                  required
                  value={kbm}
                  onChange={(e) => setKbm(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Contoh: Fiqih Kelas 1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MuallimStatus)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value={MuallimStatus.ACTIVE}>Aktif</option>
                  <option value={MuallimStatus.INACTIVE}>Tidak Aktif</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{editingMuallim ? "Simpan Perubahan" : "Simpan Muallim"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
