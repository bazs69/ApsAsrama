"use client"

import { useState, useTransition } from "react"
import { createRoom, updateRoom, deleteRoom } from "@/app/actions/rooms"
import { RoomStatus } from "@prisma/client"
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Loader2, DoorOpen, Users, Hammer, CheckCircle2, Download } from "lucide-react"

interface Resident {
  id: string
  name: string
  nim: string | null
}

interface Room {
  id: string
  number: string
  floor: number
  capacity: number
  status: RoomStatus
  residents: Resident[]
}

export default function RoomsClient({ initialRooms }: { initialRooms: Room[] }) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  
  // Form fields
  const [number, setNumber] = useState("")
  const [floor, setFloor] = useState(1)
  const [capacity, setCapacity] = useState(2)
  const [status, setStatus] = useState<RoomStatus>(RoomStatus.AVAILABLE)
  
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Stats calculate
  const totalRooms = rooms.length
  const availableRooms = rooms.filter(r => r.status === RoomStatus.AVAILABLE).length
  const occupiedRooms = rooms.filter(r => r.status === RoomStatus.OCCUPIED).length
  const maintenanceRooms = rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length

  // Filtered rooms
  const filteredRooms = rooms.filter(room => 
    room.number.toLowerCase().includes(search.toLowerCase())
  )

  // Group rooms by floor
  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = []
    acc[room.floor].push(room)
    return acc
  }, {} as Record<number, Room[]>)
  
  const sortedFloors = Object.keys(roomsByFloor).map(Number).sort((a, b) => a - b)

  const openAddModal = () => {
    setEditingRoom(null)
    setNumber("")
    setFloor(1)
    setCapacity(2)
    setStatus(RoomStatus.AVAILABLE)
    setError("")
    setIsModalOpen(true)
  }

  const openEditModal = (room: Room) => {
    setEditingRoom(room)
    setNumber(room.number)
    setFloor(room.floor)
    setCapacity(room.capacity)
    setStatus(room.status)
    setError("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      let res
      if (editingRoom) {
        res = await updateRoom(editingRoom.id, { number, floor, capacity, status })
      } else {
        res = await createRoom({ number, floor, capacity, status })
      }

      if (res.error) {
        if (res.error.includes("already exists")) {
          setError("Nomor kamar sudah terdaftar.")
        } else {
          setError(res.error)
        }
      } else if (res.success && res.room) {
        if (editingRoom) {
          setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, number, floor, capacity, status } : r))
        } else {
          setRooms(prev => [...prev, { ...res.room, residents: [] } as Room].sort((a,b) => a.number.localeCompare(b.number)))
        }
        setIsModalOpen(false)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kamar ini?")) return

    const res = await deleteRoom(id)
    if (res.error) {
      if (res.error.includes("currently assigned")) {
        alert("Tidak dapat menghapus kamar. Masih ada santri yang terdaftar di kamar ini.")
      } else {
        alert(res.error)
      }
    } else {
      setRooms(prev => prev.filter(r => r.id !== id))
    }
  }

  const exportToCSV = () => {
    const headers = ["Nomor Kamar", "Lantai", "Kapasitas Kamar", "Santri Terisi", "Status", "Nama Santri"]
    const rows = rooms.map(room => [
      room.number,
      room.floor,
      room.capacity,
      room.residents.length,
      room.status === RoomStatus.AVAILABLE ? "Tersedia" : room.status === RoomStatus.OCCUPIED ? "Penuh" : "Perbaikan",
      room.residents.map(r => r.name).join("; ")
    ])

    // Generate CSV content using BOM for proper Excel utf-8 encoding support
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Kamar_Asrama_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Manajemen Kamar</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Buat, edit, dan pantau status seluruh kamar di asrama.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-lg py-1.5 px-3 text-sm font-medium flex items-center justify-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="bg-primary-600/10 hover:bg-primary-600/20 text-primary-600 dark:text-primary-400 border border-primary-600/20 rounded-lg py-1.5 px-3 text-sm font-semibold flex items-center justify-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kamar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Total Kamar</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalRooms}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-emerald-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Tersedia</p>
            <h3 className="text-2xl font-bold text-emerald-650 dark:text-emerald-400">{availableRooms}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-primary-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Terisi / Penuh</p>
            <h3 className="text-2xl font-bold text-primary-600 dark:text-primary-400">{occupiedRooms}</h3>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-amber-500/20 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Hammer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">Perbaikan</p>
            <h3 className="text-2xl font-bold text-amber-650 dark:text-amber-400">{maintenanceRooms}</h3>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Cari kamar berdasarkan nomor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-850 dark:text-white placeholder-zinc-450 dark:placeholder-zinc-550 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm shadow-sm"
        />
      </div>

      {/* Rooms Grid per Floor */}
      {filteredRooms.length === 0 ? (
        <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-550 dark:text-zinc-500">
          Tidak ada kamar yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="space-y-10">
          {sortedFloors.map(floor => (
            <div key={floor} className="space-y-4">
              <div className="flex items-center space-x-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{floor}</span>
                </div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Lantai {floor}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {roomsByFloor[floor].map((room) => (
                  <div key={room.id} className="glass rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
                    <div className="p-5 border-b border-zinc-200 dark:border-zinc-850 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-850 dark:text-white flex items-center space-x-2">
                          <span>Kamar {room.number}</span>
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Kapasitas Kamar: {room.capacity}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        room.status === RoomStatus.AVAILABLE ? "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 border border-emerald-500/20" :
                        room.status === RoomStatus.OCCUPIED ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20" :
                        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}>
                        {room.status === RoomStatus.AVAILABLE ? "Tersedia" :
                         room.status === RoomStatus.OCCUPIED ? "Penuh" : "Perbaikan"}
                      </span>
                    </div>

                    {/* Residents detail in card */}
                    <div 
                      className="p-5 flex-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                      onClick={() => setSelectedRoom(room)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-zinc-450 dark:text-zinc-500" />
                          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Keterisian</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                          {room.residents.length} / {room.capacity}
                        </span>
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-end space-x-2 transition-colors">
                      <button
                        onClick={() => openEditModal(room)}
                        className="p-1.5 text-zinc-450 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-850 rounded-lg transition-all"
                        title="Edit Kamar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        disabled={room.residents.length > 0}
                        className="p-1.5 text-zinc-400 hover:text-red-650 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Hapus Kamar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{editingRoom ? "Edit Detail Kamar" : "Tambah Kamar Baru"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Nomor Kamar</label>
                <input
                  type="text"
                  required
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Contoh: 101, A24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Lantai</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Kapasitas Kamar</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoomStatus)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-250 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-850 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <option value={RoomStatus.AVAILABLE}>Tersedia (Kosong)</option>
                  <option value={RoomStatus.OCCUPIED}>Terisi / Penuh</option>
                  <option value={RoomStatus.MAINTENANCE}>Dalam Perbaikan (Maintenance)</option>
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
                  <span>{editingRoom ? "Perbarui Kamar" : "Simpan Kamar"}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Kamar Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRoom(null)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative z-10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Kamar {selectedRoom.number}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                  Keterisian: {selectedRoom.residents.length} / {selectedRoom.capacity} Santri
                </p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
              {selectedRoom.residents.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <DoorOpen className="w-8 h-8 text-zinc-400" />
                  <p className="text-zinc-450 dark:text-zinc-500 text-sm italic font-semibold">Kamar ini masih kosong</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRoom.residents.map(res => (
                    <div key={res.id} className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between transition-colors hover:border-zinc-300 dark:hover:border-zinc-700">
                      <div>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">{res.name}</p>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-mono">NIM: {res.nim || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
