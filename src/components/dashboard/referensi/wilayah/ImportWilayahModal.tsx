"use client"

import { useState } from "react"
import { X, Upload, FileSpreadsheet, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import * as xlsx from "xlsx"
import { importWilayah } from "@/app/actions/wilayah"

export default function ImportWilayahModal({ 
  isOpen, 
  onClose, 
  activeTab,
  dropdowns
}: { 
  isOpen: boolean
  onClose: () => void
  activeTab: string
  dropdowns: Record<string, { id: string, code: string, name: string }[]>
}) {
  const [previewData, setPreviewData] = useState<{ code: string, name: string }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [parentId, setParentId] = useState("")

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = xlsx.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = xlsx.utils.sheet_to_json(ws)
        
        const mappedData = data.map((r) => {
          const row = r as Record<string, string | undefined>
          return {
            code: row.code || row.Kode || row.KODE || "",
            name: row.name || row.Name || row.Nama || row.NAMA || ""
          }
        }).filter(r => r.code && r.name)

        setPreviewData(mappedData)
      } catch {
        toast.error("Gagal membaca file Excel. Pastikan format sesuai.")
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error("Tidak ada data valid untuk diimport")
      return
    }
    if (activeTab !== "negara" && !parentId) {
      toast.error("Pilih induk wilayah terlebih dahulu")
      return
    }

    setIsProcessing(true)
    try {
      const res = await importWilayah(previewData, activeTab, parentId)
      if (res.success) {
        toast.success(`${res.count} data berhasil diimport!`)
        onClose()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengimport data"
      toast.error(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Import Data <span className="capitalize">{activeTab}</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex gap-3">
            <InfoIcon className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold mb-1">Panduan Import XLSX</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>File Excel harus memiliki header baris pertama: <strong>code</strong> dan <strong>name</strong>.</li>
                <li>Maksimal baris disarankan: 10,000 baris.</li>
                {activeTab !== "negara" && <li>Anda wajib memilih Induk Wilayah sebelum memproses import.</li>}
              </ul>
            </div>
          </div>

          {activeTab !== "negara" && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Pilih Induk Wilayah ({
                  activeTab === "provinsi" ? "Negara" : 
                  activeTab === "kabupaten" ? "Provinsi" : 
                  activeTab === "kecamatan" ? "Kabupaten/Kota" : "Kecamatan"
                })
              </label>
              <select 
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">-- Pilih Induk Wilayah --</option>
                {activeTab === "provinsi" && dropdowns.countries?.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
                {activeTab === "kabupaten" && dropdowns.provinces?.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
                {activeTab === "kecamatan" && dropdowns.regencies?.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
                {activeTab === "desa" && dropdowns.districts?.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih File Excel (.xlsx)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">
                    <span className="font-semibold text-blue-600">Klik untuk upload</span> atau drag & drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">XLSX (MAX. 10MB)</p>
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {previewData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-700">Preview Data ({previewData.length} baris)</h4>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-slate-600">Kode</th>
                      <th className="px-4 py-2 font-semibold text-slate-600">Nama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewData.slice(0, 100).map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-mono text-xs">{row.code}</td>
                        <td className="px-4 py-2">{row.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 100 && (
                  <div className="p-2 text-center text-xs text-slate-500 bg-slate-100 font-medium">
                    Menampilkan 100 baris pertama dari {previewData.length} total baris
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50 rounded-b-2xl">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 bg-white rounded-lg font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={handleImport}
            disabled={isProcessing || previewData.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Proses Import
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  )
}
