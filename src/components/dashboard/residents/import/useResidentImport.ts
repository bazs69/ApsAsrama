import { useRef, useState, useTransition } from "react"
import { bulkCreateResidents } from "@/app/actions/residents"
import * as XLSX from "xlsx"
import { formatImportedResidentRows, parseResidentImportWorksheet } from "./residentImportMapper"
import { validateResidentImportRows } from "./residentImportValidation"

export function useResidentImport() {
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setError("")

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = parseResidentImportWorksheet(ws)
        const formattedData = formatImportedResidentRows(data)
        const validationError = validateResidentImportRows(formattedData)

        if (validationError) {
          setError(validationError)
          setImporting(false)
          return
        }

        startTransition(async () => {
          const res = await bulkCreateResidents(formattedData as Parameters<typeof bulkCreateResidents>[0])
          if (res.error) {
            setError(res.error)
          } else if (res.successCount === 0) {
            setError(`Tidak ada santri yang berhasil diimpor. ${res.skippedCount} baris dilewati karena NIM/NIUP duplikat atau data tidak valid.`)
          } else {
            alert(`Berhasil impor ${res.successCount} santri. ${res.skippedCount} baris dilewati karena NIM/NIUP duplikat atau data tidak valid. Halaman akan dimuat ulang.`)
            window.location.reload()
          }
          setImporting(false)
        })
      } catch {
        setError("Gagal memproses file Excel.")
        setImporting(false)
      }
    }
    reader.readAsBinaryString(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return {
    importing,
    error,
    fileInputRef,
    handleFileUpload,
    setError
  }
}
