/**
 * Error Normalizer
 * 
 * Transforms any unknown error thrown during a request into a standardized ApiFailure structure.
 */

import { type ApiFailure, type RequestMetadata } from "./requestTypes"
import { TimeoutError } from "./requestTimeout"

export function normalizeError(error: unknown, metadata: RequestMetadata): ApiFailure {
  // If it's already an ApiFailure format from deeper in the stack
  if (typeof error === 'object' && error !== null && 'success' in error && error.success === false && 'error' in error) {
    return error as ApiFailure
  }

  let code = "UNKNOWN_ERROR"
  let title = "Terjadi Kesalahan"
  let description = "Kesalahan sistem tidak dikenal."
  let severity: "info" | "warning" | "error" | "critical" = "error"
  let retryable = false

  if (error instanceof TimeoutError) {
    code = "TIMEOUT_ERROR"
    title = "Koneksi Terputus (Timeout)"
    description = "Server membutuhkan waktu terlalu lama untuk merespons. Silakan coba lagi."
    severity = "warning"
    retryable = true
  } else if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    
    if (error.name === "AbortError" || msg.includes("aborted")) {
      code = "ABORT_ERROR"
      title = "Permintaan Dibatalkan"
      description = "Permintaan ini dibatalkan secara sistem."
      severity = "info"
      retryable = false
    } else if (msg.includes("network") || msg.includes("fetch")) {
      code = "NETWORK_ERROR"
      title = "Koneksi Terputus"
      description = "Gagal terhubung ke jaringan. Periksa koneksi internet Anda."
      severity = "warning"
      retryable = true
    } else if (msg.includes("unauthorized") || msg.includes("session")) {
      code = "UNAUTHORIZED"
      title = "Sesi Berakhir"
      description = "Sesi Anda telah berakhir. Silakan login kembali."
      severity = "critical"
      retryable = false
    } else if (msg.includes("forbidden") || msg.includes("izin")) {
      code = "FORBIDDEN"
      title = "Akses Ditolak"
      description = "Anda tidak memiliki izin untuk melakukan tindakan ini."
      severity = "error"
      retryable = false
    } else {
      // General error fallback
      description = error.message
    }
  }

  return {
    success: false,
    error: {
      code,
      title,
      description,
      severity,
      retryable,
    },
    metadata
  }
}
