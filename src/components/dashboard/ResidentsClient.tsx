"use client"

import { useState, useTransition } from "react"
import { bulkDeleteResidents, bulkMoveResidents } from "@/app/actions/residents"
import { Resident, WilayahNode, RoomStatus } from "./residents/types"
import { X, AlertCircle, Loader2, DoorOpen } from "lucide-react"
import ResidentDetailModal from "./ResidentDetailModal"
import SantriWizard from "@/components/dashboard/santri/wizard/SantriWizard"
import ResidentsStats from "./residents/ResidentsStats"
import ResidentsToolbar from "./residents/ResidentsToolbar"
import ResidentsSearchBar from "./residents/ResidentsSearchBar"
import ResidentsFilter from "./residents/ResidentsFilter"
import ResidentsTable from "./residents/ResidentsTable"
import { useResidentSearch } from "./residents/useResidentSearch"
import { useResidentFilter } from "./residents/useResidentFilter"
import { useResidentSelection } from "./residents/useResidentSelection"
import { useResidentStats } from "./residents/useResidentStats"
import { downloadResidentImportTemplate, exportResidentsToCSV, printResidentsPDF } from "@/utils/residentExport"
import { useResidentImport } from "./residents/import/useResidentImport"

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
  const { search, setSearch } = useResidentSearch()
  const {
    showFilter,
    filterWilayah,
    filterProdi,
    filterAngkatan,
    filterKamar,
    setFilterWilayah,
    setFilterProdi,
    setFilterAngkatan,
    setFilterKamar,
    toggleFilter,
    resetFilters,
    uniqueWilayah,
    uniqueProdi,
    uniqueAngkatan,
    uniqueKamar,
    filteredResidents
  } = useResidentFilter({ residents, search })
  const {
    selectedResidents: selectedIds,
    isSelectionMode: isSelectionActive,
    toggleSelection: handleSelectToggle,
    toggleSelectAll: handleSelectAll,
    clearSelection,
    selectedCount,
    toggleSelectionMode
  } = useResidentSelection()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
  const [viewingResident, setViewingResident] = useState<Resident | null>(null)

  const [moveRoomId, setMoveRoomId] = useState("")

  const [isPending, startTransition] = useTransition()
  const { importing, error, fileInputRef, handleFileUpload, setError } = useResidentImport()

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedCount} santri terpilih?`)) return

    startTransition(async () => {
      const idsArray = Array.from(selectedIds)
      const res = await bulkDeleteResidents(idsArray)
      if (res.error) {
        alert(res.error)
      } else {
        setResidents(prev => prev.filter(r => !selectedIds.has(r.id)))
        clearSelection()
      }
    })
  }

  const handleBulkMove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCount === 0) return

    startTransition(async () => {
      const idsArray = Array.from(selectedIds)
      const res = await bulkMoveResidents(idsArray, { roomId: moveRoomId })
      
      if (res.error) {
        setError(res.error)
      } else {
        setIsMoveModalOpen(false)
        clearSelection()
        alert("Berhasil memindahkan santri.")
        window.location.reload()
      }
    })
  }

  const { totalResidents, activeResidents, inactiveResidents } = useResidentStats(residents)

  // Filter rooms that have slot availability OR is the room currently assigned to this resident
  const availableRooms = rooms.filter(room => {
    const hasCapacity = room.residents.length < room.capacity
    const isAvailable = room.status === RoomStatus.AVAILABLE
    const isCurrentRoom = editingResident && editingResident.roomId === room.id
    return (isAvailable && hasCapacity) || isCurrentRoom
  })

  // Cascading options






  const exportToCSV = () => exportResidentsToCSV(residents)

  const downloadTemplate = () => downloadResidentImportTemplate()

  const printPDF = () => printResidentsPDF(residents)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Direktori Santri</h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-sm">Daftarkan santri baru, kelola detail kamar, dan pantau database santri.</p>
        </div>
        <ResidentsToolbar
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          importing={importing}
          downloadTemplate={downloadTemplate}
          exportToCSV={exportToCSV}
          printPDF={printPDF}
          isSelectionActive={isSelectionActive}
          toggleSelectionMode={toggleSelectionMode}
          selectedIds={selectedIds}
          onOpenMoveModal={() => {
            setError("")
            setIsMoveModalOpen(true)
          }}
          handleBulkDelete={handleBulkDelete}
        />
      </div>

      {/* Stats Cards */}
      <ResidentsStats
        totalResidents={totalResidents}
        activeResidents={activeResidents}
        inactiveResidents={inactiveResidents}
      />

      {/* Search & Filter Bar */}
      <ResidentsSearchBar
        search={search}
        onSearchChange={setSearch}
        showFilter={showFilter}
        onToggleFilter={toggleFilter}
        filteredCount={filteredResidents.length}
        hasActiveFilters={!!(filterWilayah || filterProdi || filterAngkatan || filterKamar || search)}
        onResetFilters={() => {
          resetFilters()
          setSearch("")
        }}
      />

      {/* Advanced Filters */}
      {showFilter && (
        <ResidentsFilter
          filterWilayah={filterWilayah}
          filterProdi={filterProdi}
          filterAngkatan={filterAngkatan}
          filterKamar={filterKamar}
          uniqueWilayah={uniqueWilayah}
          uniqueProdi={uniqueProdi}
          uniqueAngkatan={uniqueAngkatan}
          uniqueKamar={uniqueKamar}
          setFilterWilayah={setFilterWilayah}
          setFilterProdi={setFilterProdi}
          setFilterAngkatan={setFilterAngkatan}
          setFilterKamar={setFilterKamar}
        />
      )}

      {/* Residents Table */}
      <ResidentsTable
        filteredResidents={filteredResidents}
        isSelectionActive={isSelectionActive}
        selectedIds={selectedIds}
        handleSelectAll={handleSelectAll}
        handleSelectToggle={handleSelectToggle}
        setViewingResident={setViewingResident}
      />
      
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
