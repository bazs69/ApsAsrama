"use client"

import { useState, useTransition } from "react"
import { Plus, Edit2, Trash2, Map, MapPin, DoorOpen, ChevronDown, ChevronRight, AlertCircle, Loader2, Users } from "lucide-react"
import { createWilayah, updateWilayah, deleteWilayah, createDaerah, updateDaerah, deleteDaerah, createAreaRoom, updateAreaRoom, deleteAreaRoom } from "@/app/actions/area"
import { RoomStatus } from "@prisma/client"

type Resident = { id: string }
type Room = { id: string, number: string, capacity: number, floor: number, status: RoomStatus, residents: Resident[] }
type Daerah = { id: string, name: string, wilayahId: string | null, rooms: Room[] }
type Wilayah = { id: string, name: string, daerahs: Daerah[] }

export default function AreaClient({ initialHierarchy }: { initialHierarchy: Wilayah[] }) {
  const [hierarchy] = useState<Wilayah[]>(initialHierarchy)
  
  // Expanded states
  const [expandedWilayahs, setExpandedWilayahs] = useState<Set<string>>(new Set())
  const [expandedDaerahs, setExpandedDaerahs] = useState<Set<string>>(new Set())

  // Modal states
  const [modalType, setModalType] = useState<"wilayah" | "daerah" | "room" | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Form Data
  const [id, setId] = useState("")
  const [name, setName] = useState("")
  const [wilayahId, setWilayahId] = useState("")
  const [daerahId, setDaerahId] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [roomCapacity, setRoomCapacity] = useState(4)
  const [roomFloor, setRoomFloor] = useState(1)
  const [roomStatus, setRoomStatus] = useState<RoomStatus>("AVAILABLE")

  const toggleWilayah = (wId: string) => {
    setExpandedWilayahs(prev => {
      const next = new Set(prev)
      if (next.has(wId)) next.delete(wId)
      else next.add(wId)
      return next
    })
  }

  const toggleDaerah = (dId: string) => {
    setExpandedDaerahs(prev => {
      const next = new Set(prev)
      if (next.has(dId)) next.delete(dId)
      else next.add(dId)
      return next
    })
  }

  // WILAYAH ACTIONS
  const openCreateWilayah = () => {
    setName("")
    setModalType("wilayah")
    setModalMode("create")
    setError("")
  }

  const openEditWilayah = (w: Wilayah) => {
    setId(w.id)
    setName(w.name)
    setModalType("wilayah")
    setModalMode("edit")
    setError("")
  }

  // DAERAH ACTIONS
  const openCreateDaerah = (wId: string) => {
    setName("")
    setWilayahId(wId)
    setModalType("daerah")
    setModalMode("create")
    setError("")
    // Auto expand parent
    setExpandedWilayahs(prev => new Set(prev).add(wId))
  }

  const openEditDaerah = (d: Daerah, wId: string) => {
    setId(d.id)
    setName(d.name)
    setWilayahId(wId)
    setModalType("daerah")
    setModalMode("edit")
    setError("")
  }

  // ROOM ACTIONS
  const openCreateRoom = (dId: string) => {
    setRoomNumber("")
    setRoomCapacity(4)
    setRoomFloor(1)
    setRoomStatus("AVAILABLE")
    setDaerahId(dId)
    setModalType("room")
    setModalMode("create")
    setError("")
    // Auto expand parent
    setExpandedDaerahs(prev => new Set(prev).add(dId))
  }

  const openEditRoom = (r: Room, dId: string) => {
    setId(r.id)
    setRoomNumber(r.number)
    setRoomCapacity(r.capacity)
    setRoomFloor(r.floor)
    setRoomStatus(r.status)
    setDaerahId(dId)
    setModalType("room")
    setModalMode("edit")
    setError("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      if (modalType === "wilayah") {
        const res = modalMode === "create" ? await createWilayah(name) : await updateWilayah(id, name)
        if (res.error) setError(res.error)
        else window.location.reload()
      } else if (modalType === "daerah") {
        const res = modalMode === "create" ? await createDaerah(name, wilayahId) : await updateDaerah(id, name, wilayahId)
        if (res.error) setError(res.error)
        else window.location.reload()
      } else if (modalType === "room") {
        const data = { number: roomNumber, capacity: roomCapacity, floor: roomFloor, status: roomStatus, daerahId }
        const res = modalMode === "create" ? await createAreaRoom(data) : await updateAreaRoom(id, data)
        if (res.error) setError(res.error)
        else window.location.reload()
      }
    })
  }

  const handleDeleteWilayah = async (id: string) => {
    if (!confirm("Hapus Wilayah ini? Semua data di dalamnya harus kosong terlebih dahulu.")) return
    const res = await deleteWilayah(id)
    if (res.error) alert(res.error)
    else window.location.reload()
  }

  const handleDeleteDaerah = async (id: string) => {
    if (!confirm("Hapus Daerah ini? Semua kamar di dalamnya harus kosong terlebih dahulu.")) return
    const res = await deleteDaerah(id)
    if (res.error) alert(res.error)
    else window.location.reload()
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Hapus Kamar ini? Kamar harus kosong dari penghuni.")) return
    const res = await deleteAreaRoom(id)
    if (res.error) alert(res.error)
    else window.location.reload()
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-end">
        <button
          onClick={openCreateWilayah}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 px-5 font-semibold shadow-md flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Wilayah Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {hierarchy.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-zinc-500 border border-zinc-200 dark:border-zinc-800">
            Belum ada data area. Silakan tambahkan Wilayah pertama Anda.
          </div>
        ) : (
          hierarchy.map((w) => {
            const isWExpanded = expandedWilayahs.has(w.id)
            return (
              <div key={w.id} className="glass rounded-2xl border border-zinc-200/60 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all">
                {/* Wilayah Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-900/50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3 flex-1" onClick={() => toggleWilayah(w.id)}>
                    <div className={`p-2 rounded-xl transition-colors ${isWExpanded ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      <Map className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 dark:text-white text-lg flex items-center">
                        Wilayah {w.name}
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 text-zinc-400 ${isWExpanded ? 'rotate-180' : ''}`} />
                      </h3>
                      <p className="text-xs text-zinc-500">{w.daerahs.length} Daerah terdaftar</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); openCreateDaerah(w.id) }} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg tooltip-trigger" title="Tambah Daerah">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openEditWilayah(w) }} className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteWilayah(w.id) }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Daerah List */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isWExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3 mt-4">
                    {w.daerahs.length === 0 ? (
                      <p className="text-sm text-zinc-400 italic py-2 pl-4">Belum ada daerah di wilayah ini.</p>
                    ) : (
                      w.daerahs.map((d) => {
                        const isDExpanded = expandedDaerahs.has(d.id)
                        return (
                          <div key={d.id} className="border border-zinc-200 dark:border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/30">
                            {/* Daerah Header */}
                            <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleDaerah(d.id)}>
                              <div className="flex items-center space-x-3 ml-2">
                                <MapPin className={`w-4 h-4 ${isDExpanded ? 'text-emerald-500' : 'text-zinc-400'}`} />
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Daerah {d.name}</span>
                                <span className="text-xs text-zinc-500 bg-zinc-200/50 dark:bg-zinc-700/50 px-2 py-0.5 rounded-full">{d.rooms.length} Kamar</span>
                              </div>
                              <div className="flex items-center space-x-1 pr-1">
                                <button onClick={(e) => { e.stopPropagation(); openCreateRoom(d.id) }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md">
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openEditDaerah(d, w.id) }} className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteDaerah(d.id) }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${isDExpanded ? 'rotate-90' : ''} ml-2`} />
                              </div>
                            </div>

                            {/* Rooms List */}
                            {isDExpanded && (
                              <div className="p-3 border-t border-zinc-200/50 dark:border-zinc-700/50 bg-white dark:bg-zinc-900/40">
                                {d.rooms.length === 0 ? (
                                  <p className="text-xs text-zinc-400 italic pl-4">Belum ada kamar.</p>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    {d.rooms.map((r) => {
                                      const isFull = r.residents.length >= r.capacity;
                                      return (
                                      <div key={r.id} className="relative group bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm hover:border-primary-400 dark:hover:border-primary-500/50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                          <div className="flex items-center space-x-2">
                                            <DoorOpen className="w-4 h-4 text-zinc-400" />
                                            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{r.number}</span>
                                          </div>
                                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditRoom(r, d.id)} className="p-1 text-zinc-400 hover:text-primary-600">
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDeleteRoom(r.id)} className="p-1 text-zinc-400 hover:text-red-500">
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex items-center space-x-1 text-zinc-500">
                                            <Users className="w-3 h-3" />
                                            <span className={isFull ? 'text-red-500 font-semibold' : ''}>{r.residents.length}/{r.capacity}</span>
                                          </div>
                                          <span className="text-zinc-400">Lt. {r.floor}</span>
                                        </div>
                                      </div>
                                    )})}
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
              {modalMode === "create" ? "Tambah" : "Edit"} {modalType === "wilayah" ? "Wilayah" : modalType === "daerah" ? "Daerah" : "Kamar"}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* WILAYAH / DAERAH NAME */}
              {(modalType === "wilayah" || modalType === "daerah") && (
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
              )}

              {/* ROOM FIELDS */}
              {modalType === "room" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Nomor/Nama Kamar</label>
                    <input
                      type="text"
                      required
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-zinc-800 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Kapasitas</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={roomCapacity}
                        onChange={(e) => setRoomCapacity(Number(e.target.value))}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-zinc-800 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Lantai</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={roomFloor}
                        onChange={(e) => setRoomFloor(Number(e.target.value))}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-zinc-800 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Status Kamar</label>
                    <select
                      value={roomStatus}
                      onChange={(e) => setRoomStatus(e.target.value as RoomStatus)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2 px-3 text-zinc-800 dark:text-white focus:ring-2 focus:ring-primary-500/40 focus:outline-none"
                    >
                      <option value="AVAILABLE">Tersedia</option>
                      <option value="OCCUPIED">Penuh</option>
                      <option value="MAINTENANCE">Perbaikan</option>
                    </select>
                  </div>
                </>
              )}

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
