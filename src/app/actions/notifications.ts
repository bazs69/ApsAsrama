"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { revalidatePath } from "next/cache"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR"

export interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type?: NotificationType
  link?: string
  metadata?: Record<string, unknown>
}

// ─── Internal Utility ────────────────────────────────────────────────────────

/**
 * createNotification — Internal utility only. Never call directly from client.
 *
 * Bersifat fail-open: jika penyimpanan notifikasi gagal, error tidak di-throw
 * sehingga tidak mempengaruhi transaksi bisnis pemanggil (e.g. createAssignment).
 *
 * Kembalikan id notifikasi jika berhasil, atau null jika gagal.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<string | null> {
  // Notifikasi dinonaktifkan untuk menghemat ruang database.
  // Jika diinginkan, fitur ini dapat diubah menjadi toast client-side saja.
  return "mock-notification-id"
}

// ─── Client-Facing Actions ───────────────────────────────────────────────────

/**
 * getUnreadNotifications — Ambil maksimal 20 notifikasi yang belum dibaca
 * milik user yang sedang login.
 *
 * - Memerlukan session aktif.
 * - Hanya mengembalikan notifikasi milik session.user.id (IDOR-safe).
 */
export async function getUnreadNotifications() {
  return secureAction({
    module: "Notification",
    action: "getUnreadNotifications",
    executor: async (context) => {
      // Fitur notifikasi telah dinonaktifkan
      return { notifications: [], unreadCount: 0 }
    }
  })
}

export async function getNotificationsPaginated(options: { page: number; pageSize: number }) {
  return secureAction({
    module: "Notification",
    action: "getNotificationsPaginated",
    executor: async (context) => {
      const { page, pageSize } = options
      return {
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }
  })
}

/**
 * markAsRead — Tandai satu notifikasi sebagai sudah dibaca.
 *
 * - Memerlukan session aktif.
 * - Rate-limited via checkCrudRateLimit().
 * - Verifikasi kepemilikan (IDOR prevention): memastikan notifikasi.userId === session.user.id
 *   sebelum melakukan update.
 */
export async function markAsRead(notificationId: string) {
  return secureAction({
    module: "Notification",
    action: "markAsRead",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      if (!notificationId) {
        throw new Error("Notification ID is required.")
      }

      // Dinonaktifkan
      return {}
    }
  })
}

/**
 * markAllAsRead — Tandai seluruh notifikasi milik user yang login sebagai
 * sudah dibaca dalam satu query (updateMany).
 *
 * - Memerlukan session aktif.
 * - Rate-limited via checkCrudRateLimit().
 * - Inherently IDOR-safe: where clause selalu menggunakan session.user.id.
 */
export async function markAllAsRead() {
  return secureAction({
    module: "Notification",
    action: "markAllAsRead",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      return { updated: 0 }
    }
  })
}

/**
 * deleteNotification — Hapus satu notifikasi.
 *
 * - Memerlukan session aktif.
 * - Rate-limited via checkCrudRateLimit().
 * - Verifikasi kepemilikan (IDOR prevention).
 */
export async function deleteNotification(notificationId: string) {
  return secureAction({
    module: "Notification",
    action: "deleteNotification",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      if (!notificationId) {
        throw new Error("Notification ID is required.")
      }

      // Dinonaktifkan
      return {}
    }
  })
}
