import * as XLSX from "xlsx"
import {
  hasRequiredResidentImportData,
  ResidentImportExcelRow,
  ResidentImportRow
} from "./residentImportValidation"

export const residentImportColumnAliases = {
  name: ["Nama Lengkap (Wajib ada)", "Nama Lengkap", "Nama", "name"],
  nim: ["NIM (opsional)", "NIM", "nim", "Nim"],
  niup: ["NIUP (opsional)", "NIUP", "niup", "Niup"],
  nik: ["NIK (opsional)", "NIK", "nik", "Nik"],
  gender: ["Jenis Kelamin (opsional)", "Jenis Kelamin (Wajib ada)", "Jenis Kelamin", "Gender", "gender"],
  tempatLahir: ["Tempat Lahir (opsional)", "Tempat Lahir (Wajib ada)", "Tempat Lahir", "tempatLahir"],
  tanggalLahir: [
    "Tanggal Lahir (YYYY-MM-DD) (opsional)",
    "Tanggal Lahir (YYYY-MM-DD) (Wajib ada)",
    "Tanggal Lahir (YYYY-MM-DD)",
    "Tanggal Lahir",
    "tanggalLahir"
  ],
  phone: ["Nomor Telepon (opsional)", "Nomor Telepon", "phone", "No Telp"],
  fakultas: ["Fakultas (opsional)", "Fakultas", "fakultas"],
  prodi: ["Program Studi (opsional)", "Program Studi (Wajib ada)", "Program Studi", "Prodi", "prodi"],
  angkatan: ["Angkatan (opsional)", "Angkatan (Wajib ada)", "Angkatan", "angkatan"],
  wilayah: ["Wilayah (opsional)", "Wilayah", "wilayah"],
  daerah: ["Daerah (opsional)", "Daerah", "daerah"],
  roomNumber: ["Kamar (opsional)", "Kamar", "room"],
  alamatLengkap: ["Alamat Lengkap (opsional)", "Alamat Lengkap", "Alamat", "alamatLengkap"],
  kotaAsal: ["Kota Asal (opsional)", "Kota Asal", "kotaAsal"],
  kodePos: ["Kode Pos (opsional)", "Kode Pos", "KodePos", "kodePos"]
} as const

function normalizeColumnKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function readResidentImportCell(row: ResidentImportExcelRow, keys: readonly string[]): string {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeColumnKey(key),
    value
  ] as const)

  for (const key of keys) {
    const value = row[key] ?? normalizedEntries.find(([normalizedKey]) => normalizedKey === normalizeColumnKey(key))?.[1]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim()
    }
  }

  return ""
}

export function parseResidentImportWorksheet(ws: XLSX.WorkSheet): ResidentImportExcelRow[] {
  return XLSX.utils.sheet_to_json<ResidentImportExcelRow>(ws)
}

export function mapExcelRowToResidentImport(row: ResidentImportExcelRow): ResidentImportRow {
  return {
    name: readResidentImportCell(row, residentImportColumnAliases.name),
    nim: readResidentImportCell(row, residentImportColumnAliases.nim),
    niup: readResidentImportCell(row, residentImportColumnAliases.niup) || null,
    nik: readResidentImportCell(row, residentImportColumnAliases.nik) || null,
    gender: readResidentImportCell(row, residentImportColumnAliases.gender) || null,
    tempatLahir: readResidentImportCell(row, residentImportColumnAliases.tempatLahir) || null,
    tanggalLahir: readResidentImportCell(row, residentImportColumnAliases.tanggalLahir) || null,
    phone: readResidentImportCell(row, residentImportColumnAliases.phone),
    fakultas: readResidentImportCell(row, residentImportColumnAliases.fakultas),
    prodi: readResidentImportCell(row, residentImportColumnAliases.prodi),
    angkatan: readResidentImportCell(row, residentImportColumnAliases.angkatan),
    wilayah: readResidentImportCell(row, residentImportColumnAliases.wilayah),
    daerah: readResidentImportCell(row, residentImportColumnAliases.daerah),
    roomNumber: readResidentImportCell(row, residentImportColumnAliases.roomNumber),
    alamatLengkap: readResidentImportCell(row, residentImportColumnAliases.alamatLengkap) || undefined,
    kotaAsal: readResidentImportCell(row, residentImportColumnAliases.kotaAsal) || undefined,
    kodePos: readResidentImportCell(row, residentImportColumnAliases.kodePos) || undefined
  }
}

export function formatImportedResidentRows(rows: ResidentImportExcelRow[]): ResidentImportRow[] {
  return rows.map(mapExcelRowToResidentImport).filter(hasRequiredResidentImportData)
}
