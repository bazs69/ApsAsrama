export const importHeaders = [
  "Nama Lengkap (Wajib ada)",
  "NIM (opsional)",
  "NIUP (opsional)",
  "NIK (opsional)",
  "Jenis Kelamin (opsional)",
  "Tempat Lahir (opsional)",
  "Tanggal Lahir (YYYY-MM-DD) (opsional)",
  "Nomor Telepon (opsional)",
  "Fakultas (opsional)",
  "Program Studi (opsional)",
  "Angkatan (opsional)",
  "Wilayah (opsional)",
  "Daerah (opsional)",
  "Kamar (opsional)",
  "Alamat Lengkap (opsional)",
  "Kota Asal (opsional)",
  "Kode Pos (opsional)",
]

export function readExcelCell(row: Record<string, string | number | undefined>, keys: string[]): string {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    key.toLowerCase().replace(/[^a-z0-9]/g, ""),
    value
  ] as const)

  for (const key of keys) {
    const value = row[key] ?? normalizedEntries.find(([normalizedKey]) => normalizedKey === key.toLowerCase().replace(/[^a-z0-9]/g, ""))?.[1]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim()
    }
  }
  return ""
}

export function hasRequiredImportData(row: {
  name: string | number
}): boolean {
  return Boolean(String(row.name || "").trim())
}
