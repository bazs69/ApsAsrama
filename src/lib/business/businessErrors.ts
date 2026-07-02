/**
 * Enterprise Business Error Layer
 * 
 * Single Source of Truth (SSOT) for all business domain errors across Master Data
 * and other operational modules.
 */

export class BusinessError extends Error {
  public readonly code: string

  constructor(message: string, code: string = "BUSINESS_ERROR") {
    super(message)
    this.name = "BusinessError"
    this.code = code
  }

  static alreadyExists(entity: string): BusinessError {
    return new BusinessError(
      `Already Exists: ${entity} sudah terdaftar atau digunakan.`,
      "DUPLICATE_DATA"
    )
  }

  static cannotDelete(entity: string, relation?: string): BusinessError {
    const reason = relation
      ? ` masih direferensikan oleh data ${relation}.`
      : ` masih direferensikan oleh entitas lain.`
    return new BusinessError(`Cannot Delete: ${entity}${reason}`, "REFERENTIAL_INTEGRITY")
  }

  static invalidReference(entity: string): BusinessError {
    return new BusinessError(
      `Invalid Reference: ${entity} tidak ditemukan atau tidak valid.`,
      "INVALID_REFERENCE"
    )
  }

  static parentRequired(entity: string): BusinessError {
    return new BusinessError(
      `Parent Required: Induk data (${entity}) wajib dipilih terlebih dahulu.`,
      "PARENT_REQUIRED"
    )
  }

  static conflict(entity?: string): BusinessError {
    const target = entity ? ` (${entity})` : ""
    return new BusinessError(
      `Conflict: Data${target} telah berubah atau dihapus oleh pengguna lain.`,
      "CONCURRENCY_CONFLICT"
    )
  }

  static validation(message: string): BusinessError {
    return new BusinessError(`Validation Error: ${message}`, "VALIDATION_ERROR")
  }
}
