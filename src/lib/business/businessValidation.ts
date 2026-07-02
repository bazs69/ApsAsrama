/**
 * Enterprise Business Validation Layer
 * 
 * Centralized business validation rules to maintain consistency across all
 * Master Data Server Actions.
 */

import { BusinessError } from "./businessErrors"
import { BusinessNormalizer } from "./businessNormalizer"

export const BusinessValidation = {
  /**
   * Ensures string input is not empty after normalization.
   */
  validateNotEmpty(value: string | undefined | null, fieldName: string): string {
    const normalized = BusinessNormalizer.normalizeWhitespace(value)
    if (!normalized) {
      throw BusinessError.validation(`${fieldName} tidak boleh kosong.`)
    }
    return normalized
  },

  /**
   * Validates and normalizes an entity name.
   */
  requireName(name: string | undefined | null, entityLabel: string = "Nama"): string {
    return this.validateNotEmpty(name, entityLabel)
  },

  /**
   * Validates and normalizes an entity code.
   */
  requireCode(code: string | undefined | null, entityLabel: string = "Kode"): string {
    return BusinessNormalizer.normalizeCode(this.validateNotEmpty(code, entityLabel))
  },

  /**
   * Validates string length bounds.
   */
  validateLength(value: string, fieldName: string, maxLen: number, minLen: number = 1): void {
    if (value.length < minLen || value.length > maxLen) {
      throw BusinessError.validation(
        `${fieldName} harus memiliki panjang antara ${minLen} hingga ${maxLen} karakter.`
      )
    }
  },

  /**
   * Ensures that a parent reference ID exists and is valid.
   */
  validateParent(parentId: string | undefined | null, parentEntityLabel: string): string {
    const trimmed = (parentId || "").trim()
    if (!trimmed) {
      throw BusinessError.parentRequired(parentEntityLabel)
    }
    return trimmed
  },

  /**
   * Validates that status is within allowed values.
   */
  validateStatus<T extends string>(status: string | undefined | null, allowedStatuses: readonly T[], fieldName: string = "Status"): T {
    const val = (status || "").trim() as T
    if (!allowedStatuses.includes(val)) {
      throw BusinessError.validation(`${fieldName} tidak valid. Pilihan yang diizinkan: ${allowedStatuses.join(", ")}.`)
    }
    return val
  }
}
