import { Download, Upload, Loader2, FileText, Printer, CheckSquare, MoveRight, Trash2 } from "lucide-react"

interface ResidentsToolbarProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  importing: boolean
  downloadTemplate: () => void
  exportToCSV: () => void
  printPDF: () => void
  isSelectionActive: boolean
  toggleSelectionMode: () => void
  selectedIds: Set<string>
  onOpenMoveModal: () => void
  handleBulkDelete: () => void
}

export default function ResidentsToolbar({
  fileInputRef,
  handleFileUpload,
  importing,
  downloadTemplate,
  exportToCSV,
  printPDF,
  isSelectionActive,
  toggleSelectionMode,
  selectedIds,
  onOpenMoveModal,
  handleBulkDelete
}: ResidentsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
      />
      
      <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
        <button
          onClick={downloadTemplate}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all tooltip-trigger relative group flex items-center justify-center"
          title="Unduh Template Excel"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="p-2 text-zinc-500 hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
          title="Import Data Excel"
        >
          {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        </button>
        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
        <button
          onClick={exportToCSV}
          className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-all flex items-center justify-center"
          title="Ekspor Data ke CSV"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          onClick={printPDF}
          className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center"
          title="Cetak Laporan (PDF)"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={toggleSelectionMode}
        className={`border ${isSelectionActive ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'} rounded-xl py-2.5 px-4 font-semibold shadow-sm flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer`}
      >
        <CheckSquare className="w-4 h-4" />
        <span>{isSelectionActive ? "Nonaktifkan Memilih" : "Aktifkan Memilih"}</span>
      </button>

      {isSelectionActive && selectedIds.size > 0 && (
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenMoveModal}
            className="bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl py-2.5 px-4 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer"
          >
            <MoveRight className="w-4 h-4" />
            <span className="hidden sm:inline">Pindah Kamar</span>
          </button>
          <button
            onClick={handleBulkDelete}
            className="bg-red-650 hover:bg-red-600 text-white rounded-xl py-2.5 px-4 font-semibold shadow-md flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Hapus</span>
          </button>
        </div>
      )}
    </div>
  )
}
