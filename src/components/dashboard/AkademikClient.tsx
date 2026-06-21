"use client"

import { useState, useTransition } from "react"
import { Plus, Edit2, Trash2, Building, BookOpen, GraduationCap, ChevronDown, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { createFakultas, updateFakultas, deleteFakultas, createProdi, updateProdi, deleteProdi, createAngkatan, updateAngkatan, deleteAngkatan } from "@/app/actions/masterData"

type Angkatan = { id: string, name: string, prodiId: string }
type Prodi = { id: string, name: string, fakultasId: string, angkatans: Angkatan[] }
type Fakultas = { id: string, name: string, prodis: Prodi[] }

export default function AkademikClient({ initialHierarchy }: { initialHierarchy: Fakultas[] }) {
  const [hierarchy] = useState<Fakultas[]>(initialHierarchy)
  
  // Expanded states
  const [expandedFakultas, setExpandedFakultas] = useState<Set<string>>(new Set())
  const [expandedProdis, setExpandedProdis] = useState<Set<string>>(new Set())

  // Modal states
  const [modalType, setModalType] = useState<"fakultas" | "prodi" | "angkatan" | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Form Data
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [fakultasId, setFakultasId] = useState("")
  const [prodiId, setProdiId] = useState("")

  const toggleFakultas = (fId: string) => {
    setExpandedFakultas(prev => {
      const next = new Set(prev)
      if (next.has(fId)) next.delete(fId)
      else next.add(fId)
      return next
    })
  }

  const toggleProdi = (pId: string) => {
    setExpandedProdis(prev => {
      const next = new Set(prev)
      if (next.has(pId)) next.delete(pId)
      else next.add(pId)
      return next
    })
  }

  // FAKULTAS ACTIONS
  const openCreateFakultas = () => {
    setName("")
    setModalType("fakultas")
    setModalMode("create")
    setError("")
  }

  const openEditFakultas = (f: Fakultas) => {
    setId(f.id)
    setName(f.name)
    setModalType("fakultas")
    setModalMode("edit")
    setError("")
  }

  // PRODI ACTIONS
  const openCreateProdi = (fId: string) => {
    setName("")
    setFakultasId(fId)
    setModalType("prodi")
    setModalMode("create")
    setError("")
    // Auto expand parent
    setExpandedFakultas(prev => new Set(prev).add(fId))
  }

  const openEditProdi = (p: Prodi, fId: string) => {
    setId(p.id)
    setName(p.name)
    setFakultasId(fId)
    setModalType("prodi")
    setModalMode("edit")
    setError("")
  }

  // ANGKATAN ACTIONS
  const openCreateAngkatan = (pId: string) => {
    setName("")
    setProdiId(pId)
    setModalType("angkatan")
    setModalMode("create")
    setError("")
    // Auto expand parent
    setExpandedProdis(prev => new Set(prev).add(pId))
  }

  const openEditAngkatan = (a: Angkatan, pId: string) => {
    setId(a.id)
    setName(a.name)
    setProdiId(pId)
    setModalType("angkatan")
    setModalMode("edit")
    setError("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      if (modalType === "fakultas") {
        const res = modalMode === "create" ? await createFakultas(name) : await updateFakultas(id, name)
        if (res.error) setError(res.error)
        else window.location.reload()
      } else if (modalType === "prodi") {
        const res = modalMode === "create" ? await createProdi(name, fakultasId) : await updateProdi(id, name, fakultasId)
        if (res.error) setError(res.error)
        else window.location.reload()
      } else if (modalType === "angkatan") {
        const res = modalMode === "create" ? await createAngkatan(name, prodiId) : await updateAngkatan(id, name, prodiId)
        if (res.error) setError(res.error)
        else window.location.reload()
      }
    })
  }

  const handleDeleteFakultas = async (id: string) => {
    if (!confirm("Hapus Fakultas ini? Semua Prodi dan Angkatan di dalamnya akan terhapus.")) return
    const res = await deleteFakultas(id)
    if (res.error) alert(res.error)
    else window.location.reload()
  }

  const handleDeleteProdi = async (id: string) => {
    if (!confirm("Hapus Prodi ini? Semua Angkatan di dalamnya akan terhapus.")) return
    const res = await deleteProdi(id)
    if (res.error) alert(res.error)
    else window.location.reload()
  }

  const handleDeleteAngkatan = async (id: string) => {
    if (!confirm("Hapus Angkatan ini?")) return
    const res = await deleteAngkatan(id)
    if (res.error) alert(res.error)
    else window.location.reload()
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Menu Akademik</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Kelola data hierarki Fakultas, Prodi, dan Angkatan.</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={openCreateFakultas}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 px-5 font-semibold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Fakultas Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {hierarchy.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-zinc-500 border border-zinc-200 dark:border-zinc-800">
            Belum ada data akademik. Silakan tambahkan Fakultas pertama Anda.
          </div>
        ) : (
          hierarchy.map((f) => {
            const isFExpanded = expandedFakultas.has(f.id)
            return (
              <div key={f.id} className="glass rounded-2xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                {/* Fakultas Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-900/50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 flex-1" onClick={() => toggleFakultas(f.id)}>
                    <div className={`p-2 rounded-xl transition-colors ${isFExpanded ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-lg flex items-center">
                        {f.name}
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 text-zinc-400 ${isFExpanded ? 'rotate-180' : ''}`} />
                      </h3>
                      <p className="text-xs text-zinc-500">{f.prodis.length} Prodi terdaftar</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); openCreateProdi(f.id) }} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg tooltip-trigger" title="Tambah Prodi">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openEditFakultas(f) }} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFakultas(f.id) }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prodi List */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3 mt-4">
                    {f.prodis.length === 0 ? (
                      <p className="text-sm text-zinc-400 italic py-2 pl-4">Belum ada prodi di fakultas ini.</p>
                    ) : (
                      f.prodis.map((p) => {
                        const isPExpanded = expandedProdis.has(p.id)
                        return (
                          <div key={p.id} className="border border-zinc-200 dark:border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/30">
                            {/* Prodi Header */}
                            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleProdi(p.id)}>
                              <div className="flex items-center space-x-3 ml-2">
                                <BookOpen className={`w-4 h-4 ${isPExpanded ? 'text-emerald-500' : 'text-zinc-400'}`} />
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{p.name}</span>
                                <span className="text-xs text-zinc-500 bg-zinc-200/50 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full">{p.angkatans.length} Angkatan</span>
                              </div>
                              <div className="flex items-center space-x-1 pr-1">
                                <button onClick={(e) => { e.stopPropagation(); openCreateAngkatan(p.id) }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md" title="Tambah Angkatan">
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openEditProdi(p, f.id) }} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProdi(p.id) }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isPExpanded ? 'rotate-90' : ''} ml-2`} />
                              </div>
                            </div>

                            {/* Angkatan List */}
                            {isPExpanded && (
                              <div className="p-3 border-t border-zinc-200/50 dark:border-zinc-700/50 bg-white dark:bg-zinc-900/40">
                                {p.angkatans.length === 0 ? (
                                  <p className="text-xs text-zinc-400 italic pl-4">Belum ada angkatan.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {p.angkatans.map((a) => (
                                      <div key={a.id} className="relative group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 transition-colors">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-center space-x-2">
                                            <GraduationCap className="w-4 h-4 text-zinc-400" />
                                            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{a.name}</span>
                                          </div>
                                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditAngkatan(a, p.id)} className="p-1 text-zinc-400 hover:text-amber-600">
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDeleteAngkatan(a.id)} className="p-1 text-zinc-400 hover:text-red-500">
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalType(null)} />
          <div className="w-full max-w-md glass rounded-[24px] border border-zinc-200 dark:border-zinc-800/80 relative z-10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
              {modalMode === "create" ? "Tambah" : "Edit"} {modalType === "fakultas" ? "Fakultas" : modalType === "prodi" ? "Prodi" : "Angkatan"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Nama {modalType}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-zinc-800 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:outline-none"
                  placeholder={`Masukkan nama ${modalType}...`}
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 flex items-center space-x-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
