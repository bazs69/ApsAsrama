"use client"

import React, { useState, useEffect } from "react"
import { Search, Plus, UserX, UserCheck, Briefcase, ChevronRight, X, AlertCircle } from "lucide-react"
import { addPengurusAsrama, demisionerPengurusAsrama, searchSantriForPengurus } from "@/app/actions/pengurusActions"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function PengurusClient({ initialData }: { initialData: any[] }) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedSantri, setSelectedSantri] = useState<any | null>(null)
  
  const [jabatan, setJabatan] = useState("")
  const [divisi, setDivisi] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      const res = await searchSantriForPengurus(searchQuery)
      if (res.success && res.data) {
        setSearchResults(res.data)
      }
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleDemisioner = async (id: string) => {
    if (!confirm("Yakin ingin memberhentikan pengurus ini secara demisioner?")) return

    const res = await demisionerPengurusAsrama(id)
    if (res.success) {
      toast.success("Berhasil diberhentikan!")
      router.refresh()
    } else {
      toast.error(res.error || "Gagal memberhentikan")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSantri || !jabatan) {
      toast.error("Pilih santri dan isi jabatan terlebih dahulu!")
      return
    }

    setIsSubmitting(true)
    const res = await addPengurusAsrama({
      residentId: selectedSantri.id,
      jabatan,
      divisi
    })

    if (res.success) {
      toast.success("Berhasil mengangkat pengurus baru!")
      setIsModalOpen(false)
      setSelectedSantri(null)
      setSearchQuery("")
      setJabatan("")
      setDivisi("")
      router.refresh()
    } else {
      toast.error(res.error || "Gagal")
    }
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Cari pengurus..." 
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Angkat Pengurus
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Profil Santri</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Jabatan</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Masa Bakti</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800">Status</th>
                <th className="px-6 py-4 font-bold border-b border-zinc-200 dark:border-zinc-800 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                    Belum ada pengurus aktif.
                  </td>
                </tr>
              ) : (
                initialData.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold uppercase">
                          {p.resident.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white">{p.resident.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{p.resident.nim || "-"} • {p.resident.room?.number || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{p.jabatan}</p>
                      {p.divisi && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{p.divisi}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        Sejak {new Date(p.mulaiJabatan).toLocaleDateString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === "ACTIVE" 
                        ? "bg-success-50 text-success-600 dark:bg-success-900/20 dark:text-success-400" 
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {p.status === "ACTIVE" ? "Aktif" : "Demisioner"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "ACTIVE" && (
                        <button 
                          onClick={() => handleDemisioner(p.id)}
                          className="p-2 rounded-xl text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                          title="Berhentikan (Demisioner)"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Angkat Pengurus */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-500" /> Angkat Pengurus
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {!selectedSantri ? (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cari Santri (Ketik Min. 3 Huruf)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Nama santri..." 
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>

                  {isSearching && <p className="text-xs text-zinc-500 text-center py-2">Mencari...</p>}
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      {searchResults.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSantri(s)}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 last:border-0 flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <p className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-primary-600 transition-colors">{s.name}</p>
                            <p className="text-xs text-zinc-500">{s.nim || "Tanpa NIM"}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-primary-500" />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searchQuery.length >= 3 && searchResults.length === 0 && !isSearching && (
                    <p className="text-xs text-danger-500 text-center py-2 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Tidak ditemukan santri aktif / sudah jadi pengurus.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-primary-600 font-bold uppercase tracking-wider mb-0.5">Kandidat Pengurus</p>
                      <p className="font-black text-primary-900 dark:text-primary-100">{selectedSantri.name}</p>
                      <p className="text-sm text-primary-700 dark:text-primary-300">{selectedSantri.nim}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedSantri(null)} className="text-xs text-danger-500 font-bold hover:underline">Ganti</button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Jabatan <span className="text-danger-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Contoh: Ketua Keamanan, Musyrif..." 
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Divisi / Bagian (Opsional)</label>
                    <input 
                      type="text" 
                      value={divisi}
                      onChange={(e) => setDivisi(e.target.value)}
                      placeholder="Contoh: Seksi Kedisiplinan..." 
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!selectedSantri || !jabatan || isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? "Menyimpan..." : <><UserCheck className="w-4 h-4" /> Simpan Pengurus</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
