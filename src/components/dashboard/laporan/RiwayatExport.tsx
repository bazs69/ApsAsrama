"use client"

import { FileText, Download, Trash2, FileSpreadsheet, Printer } from "lucide-react"
import { useState } from "react"
import { deleteExportHistory } from "@/app/actions/laporan"

export default function RiwayatExport({ data }: { 
  data: {
    id: string
    fileName: string
    reportType: string
    createdAt: Date | string
    user: { name: string | null }
  }[] 
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat export ini?")) return
    
    setIsDeleting(id)
    const res = await deleteExportHistory(id)
    if (res.error) {
      alert(res.error)
    }
    setIsDeleting(null)
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return <Printer className="w-5 h-5 text-red-500" />
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
    return <FileText className="w-5 h-5 text-blue-500" />
  }

  const getFileType = (fileName: string) => {
    if (fileName.endsWith('.pdf')) return "PDF Document"
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return "Excel Spreadsheet"
    return "Document"
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="font-bold text-zinc-900 dark:text-white text-lg">Riwayat Export Laporan</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="px-5 py-4 font-semibold">Nama File</th>
              <th className="px-5 py-4 font-semibold">Jenis Laporan</th>
              <th className="px-5 py-4 font-semibold">Tipe File</th>
              <th className="px-5 py-4 font-semibold">Waktu Export</th>
              <th className="px-5 py-4 font-semibold">User</th>
              <th className="px-5 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">Belum ada riwayat export.</td>
              </tr>
            ) : (
              data?.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        {getFileIcon(row.fileName)}
                      </div>
                      <span className="font-semibold text-zinc-900 dark:text-white">{row.fileName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-medium">{row.reportType}</td>
                  <td className="px-5 py-4 text-zinc-500 text-xs font-semibold">{getFileType(row.fileName)}</td>
                  <td className="px-5 py-4">
                    <div className="text-zinc-900 dark:text-white font-medium">{new Date(row.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                    <div className="text-xs text-zinc-500">{new Date(row.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{row.user.name}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => alert("Fitur download ulang membutuhkan konfigurasi Cloud Storage. Silakan generate ulang dari tab laporan terkait.")}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-xl transition-colors"
                        title="Download Ulang (Tidak Tersedia)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(row.id)}
                        disabled={isDeleting === row.id}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
                        title="Hapus Riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
