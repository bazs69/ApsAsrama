export type ResidentImportExcelRow = Record<string, string | number | undefined>

export interface ResidentImportRow {
  name: string
  nim?: string
  niup?: string | null
  nik?: string | null
  gender?: string | null
  tempatLahir?: string | null
  tanggalLahir?: string | null
  phone?: string
  fakultas?: string
  prodi?: string
  angkatan?: string
  wilayah?: string
  daerah?: string
  roomNumber?: string
  alamatLengkap?: string
  kotaAsal?: string
  kodePos?: string
}

export const EMPTY_RESIDENT_IMPORT_ERROR =
  "Format file Excel tidak valid atau kosong. Pastikan minimal kolom Nama Lengkap terisi."

export function hasRequiredResidentImportData(row: Pick<ResidentImportRow, "name">): boolean {
  return Boolean(String(row.name || "").trim())
}

export function validateResidentImportRows(rows: ResidentImportRow[]): string | null {
  if (rows.length === 0) {
    return EMPTY_RESIDENT_IMPORT_ERROR
  }

  return null
}
