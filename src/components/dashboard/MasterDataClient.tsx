"use client"

import { useState, useTransition } from "react"
import { Plus, Search, Edit2, X, AlertCircle, Loader2, Database, Trash2 } from "lucide-react"

interface Item {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

interface MasterDataClientProps {
  title: string
  description: string
  items: Item[]
  createAction: (name: string) => Promise<{ error?: string, success?: boolean, data?: unknown }>
  updateAction: (id: string, name: string) => Promise<{ error?: string, success?: boolean, data?: unknown }>
  deleteAction: (id: string) => Promise<{ error?: string, success?: boolean, data?: unknown }>
}

export default function MasterDataClient({
  title,
  description,
  items: initialItems,
  createAction,
  updateAction,
  deleteAction
}: MasterDataClientProps) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))

  const openAddModal = () => {
    setEditingItem(null)
    setName("")
    setError("")
    setIsModalOpen(true)
  }

  const openEditModal = (item: Item) => {
    setEditingItem(item)
    setName(item.name)
    setError("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setError("")

    startTransition(async () => {
      let res
      if (editingItem) {
        res = await updateAction(editingItem.id, name)
      } else {
        res = await createAction(name)
      }

      if (res.error) {
        setError(res.error)
      } else if (res.success) {
        if (editingItem) {
          setItems(prev => prev.map(item => item.id === editingItem.id ? (res.data as Item) : item))
        } else {
          setItems(prev => [...prev, res.data as Item].sort((a, b) => a.name.localeCompare(b.name)))
        }
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data ini?`)) return

    const res = await deleteAction(id)
    if (res.error) {
      alert(res.error)
    } else {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{title}</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openAddModal}
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl py-2.5 px-5 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Data</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-800 dark:text-white placeholder-zinc-450 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Total data: <span className="font-bold text-zinc-900 dark:text-white">{filteredItems.length}</span>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
          Tidak ada data yang ditemukan.
        </div>
      ) : (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="py-4 px-6 w-16">No</th>
                  <th className="py-4 px-6">Nama</th>
                  <th className="py-4 px-6 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 text-sm text-zinc-700 dark:text-zinc-300">
                {filteredItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 text-xs">{index + 1}</td>
                    <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">{item.name}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors inline-block"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-block"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-[24px] border border-zinc-200 dark:border-zinc-800/80 overflow-hidden relative z-10 p-6 md:p-8 space-y-6 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
              <div>
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300">
                  {editingItem ? "Ubah Data" : "Tambah Data"}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
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

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Nama</label>
                <div className="relative">
                  <Database className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-transparent transition-all text-sm"
                    placeholder="Masukkan nama..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !name.trim()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 shadow-md shadow-primary-500/20 cursor-pointer"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                  ) : (
                    <span>Simpan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
