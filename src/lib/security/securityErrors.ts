/**
 * Security Error Mapper
 * 
 * Translates security error codes into structured, user-friendly error objects.
 * Ensures no raw Prisma or system errors are ever exposed to the client.
 */

import { SECURITY_CONSTANTS, type SecurityErrorCode } from "./securityConstants"
import { type SecurityError } from "./securityTypes"

const ERROR_MAP: Record<SecurityErrorCode, Omit<SecurityError, "code">> = {
  [SECURITY_CONSTANTS.ERROR_CODES.AUTH_001]: {
    title: "Tidak Terautentikasi",
    description: "Anda harus login untuk melakukan tindakan ini.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.AUTH_002]: {
    title: "Sesi Berakhir",
    description: "Sesi Anda telah berakhir. Silakan login kembali.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.AUTH_003]: {
    title: "Sesi Tidak Valid",
    description: "Format sesi tidak dikenali oleh sistem.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_001]: {
    title: "Akses Ditolak",
    description: "Anda tidak memiliki izin yang diperlukan untuk tindakan ini.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_002]: {
    title: "Akses Ditolak",
    description: "Anda tidak memiliki salah satu izin yang diperlukan.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_003]: {
    title: "Akses Ditolak",
    description: "Anda tidak memiliki semua izin yang diperlukan.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_004]: {
    title: "Akses Ditolak",
    description: "Role Anda tidak diizinkan melakukan tindakan ini.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.VALIDATION_001]: {
    title: "Validasi Gagal",
    description: "Data yang dikirim tidak memenuhi persyaratan sistem.",
    retryable: true,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.VALIDATION_002]: {
    title: "Data Sudah Ada",
    description: "Data yang Anda masukkan sudah terdaftar dalam sistem.",
    retryable: true,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.VALIDATION_003]: {
    title: "Data Tidak Ditemukan",
    description: "Data yang diminta tidak ditemukan dalam sistem.",
    retryable: false,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.RATE_001]: {
    title: "Terlalu Banyak Permintaan",
    description: "Anda telah mengirim terlalu banyak permintaan. Silakan tunggu sebentar.",
    retryable: true,
  },
  [SECURITY_CONSTANTS.ERROR_CODES.SYSTEM_001]: {
    title: "Kesalahan Sistem",
    description: "Terjadi kesalahan internal yang tidak terduga. Silakan coba lagi.",
    retryable: true,
  },
}

export function mapSecurityError(code: SecurityErrorCode, overrideDescription?: string): SecurityError {
  const base = ERROR_MAP[code] ?? ERROR_MAP[SECURITY_CONSTANTS.ERROR_CODES.SYSTEM_001]
  return {
    code,
    ...base,
    description: overrideDescription ?? base.description,
  }
}

/**
 * Determine the best SecurityErrorCode from a thrown Error instance.
 * Used to classify errors caught inside secureAction executor.
 */
export function classifyError(error: unknown): SecurityErrorCode {
  if (!(error instanceof Error)) return SECURITY_CONSTANTS.ERROR_CODES.SYSTEM_001

  const msg = error.message.toLowerCase()
  if (msg.includes("forbidden") || msg.includes("permission") || msg.includes("akses")) {
    return SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_001
  }
  if (msg.includes("unauthorized") || msg.includes("not authenticated")) {
    return SECURITY_CONSTANTS.ERROR_CODES.AUTH_001
  }
  if (msg.includes("session expired") || msg.includes("sesi")) {
    return SECURITY_CONSTANTS.ERROR_CODES.AUTH_002
  }
  if (msg.includes("not found") || msg.includes("tidak ditemukan")) {
    return SECURITY_CONSTANTS.ERROR_CODES.VALIDATION_003
  }
  if (msg.includes("already") || msg.includes("sudah") || msg.includes("duplicate")) {
    return SECURITY_CONSTANTS.ERROR_CODES.VALIDATION_002
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return SECURITY_CONSTANTS.ERROR_CODES.RATE_001
  }
  return SECURITY_CONSTANTS.ERROR_CODES.SYSTEM_001
}
