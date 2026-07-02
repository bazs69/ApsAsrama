/**
 * Attendance Business Rule Layer
 * 
 * Single Source of Truth (SSOT) for validating attendance statuses,
 * dates, and entity integrity across Apel, Kegiatan, and Muallim modules.
 */

import { AbsensiStatus, KehadiranApel, KehadiranStatus } from "@prisma/client"
import { BusinessError } from "./businessErrors"

export const AttendanceBusiness = {
  /**
   * Validates a general attendance status against allowed list.
   */
  validateAttendanceStatus(status: string | undefined | null, allowedStatuses: string[], label: string = "Status Kehadiran"): string {
    const clean = (status || "").trim().toUpperCase()
    if (!clean) {
      throw BusinessError.validation(`${label} wajib diisi.`)
    }
    if (!allowedStatuses.includes(clean)) {
      throw BusinessError.validation(`${label} tidak valid: ${clean}. Pilihan sah: ${allowedStatuses.join(", ")}`)
    }
    return clean
  },

  /**
   * Validates KehadiranApel enum values.
   */
  validateApelStatus(status?: string | KehadiranApel | null): KehadiranApel {
    const clean = (status || "").trim().toUpperCase()
    if (!clean) return KehadiranApel.HADIR
    if (Object.values(KehadiranApel).includes(clean as KehadiranApel)) {
      return clean as KehadiranApel
    }
    throw BusinessError.validation(`Status kehadiran apel tidak valid: ${clean}.`)
  },

  /**
   * Validates KehadiranStatus enum values for Kegiatan.
   */
  validateKegiatanStatus(status?: string | KehadiranStatus | null): KehadiranStatus {
    const clean = (status || "").trim().toUpperCase()
    if (!clean) return KehadiranStatus.HADIR
    if (Object.values(KehadiranStatus).includes(clean as KehadiranStatus)) {
      return clean as KehadiranStatus
    }
    throw BusinessError.validation(`Status kehadiran kegiatan tidak valid: ${clean}.`)
  },

  /**
   * Validates AbsensiStatus enum values for Muallim.
   */
  validateMuallimStatus(status?: string | AbsensiStatus | null): AbsensiStatus {
    const clean = (status || "").trim().toUpperCase()
    if (!clean) return AbsensiStatus.HADIR
    if (Object.values(AbsensiStatus).includes(clean as AbsensiStatus)) {
      return clean as AbsensiStatus
    }
    throw BusinessError.validation(`Status absensi muallim tidak valid: ${clean}.`)
  },

  /**
   * Validates that attendance date is provided and valid.
   */
  validateAttendanceDate(date?: Date | string | null, label: string = "Tanggal Absensi"): Date {
    if (!date) {
      throw BusinessError.validation(`${label} wajib diisi.`)
    }
    const parsed = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(parsed.getTime())) {
      throw BusinessError.validation(`${label} tidak valid format tanggalnya.`)
    }
    return parsed
  },

  /**
   * Validates existence of an attendance event or entity.
   */
  validateAttendanceEntity<T>(entity: T | null | undefined, entityName: string): T {
    if (!entity) {
      throw BusinessError.invalidReference(entityName)
    }
    return entity
  }
}
