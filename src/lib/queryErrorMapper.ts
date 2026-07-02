/**
 * Query Error Mapper
 * 
 * Standardizes error responses across all queries and mutations.
 * Provides a unified way to display toasts/errors from React Query boundaries.
 */

export type ErrorSeverity = "info" | "warning" | "error" | "critical"

export interface MappedError {
  title: string
  description: string
  severity: ErrorSeverity
  retryable: boolean
}

export function mapQueryError(error: unknown): MappedError {
  // If we have a standardized error object from backend (e.g. { error: "Message" })
  const errObj = typeof error === 'object' && error !== null ? error as Record<string, unknown> : null
  const message = (errObj?.message as string) || (errObj?.error as string) || String(error)

  if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch")) {
    return {
      title: "Koneksi Terputus",
      description: "Gagal terhubung ke server. Periksa koneksi internet Anda.",
      severity: "warning",
      retryable: true,
    }
  }

  if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("session")) {
    return {
      title: "Sesi Berakhir",
      description: "Sesi Anda telah berakhir. Silakan login kembali.",
      severity: "critical",
      retryable: false,
    }
  }

  if (message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("izin")) {
    return {
      title: "Akses Ditolak",
      description: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
      severity: "error",
      retryable: false,
    }
  }

  // Default fallback
  return {
    title: "Terjadi Kesalahan",
    description: message || "Kesalahan sistem tidak dikenal.",
    severity: "error",
    retryable: true,
  }
}
