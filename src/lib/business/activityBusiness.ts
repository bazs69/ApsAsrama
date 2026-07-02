/**
 * Activity Business Rule Layer
 * 
 * Single Source of Truth (SSOT) for validating KBM names, activity names,
 * activity dates, and duplicate prevention.
 */

import { BusinessError } from "./businessErrors"
import { BusinessValidation } from "./businessValidation"

export const ActivityBusiness = {
  /**
   * Validates and cleans KBM name.
   */
  validateKBMName(name?: string | null): string {
    return BusinessValidation.requireName(name, "Nama KBM")
  },

  /**
   * Validates and cleans Activity (Kegiatan) name.
   */
  validateActivityName(name?: string | null): string {
    return BusinessValidation.requireName(name, "Nama Kegiatan")
  },

  /**
   * Validates Activity date.
   */
  validateActivityDate(date?: Date | string | null, label: string = "Tanggal Kegiatan"): Date {
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
   * Throws alreadyExists BusinessError if duplicate found.
   */
  validateActivityDuplicate(existing: unknown | null, entityName: string = "Kegiatan/KBM"): void {
    if (existing) {
      throw BusinessError.alreadyExists(entityName)
    }
  }
}
