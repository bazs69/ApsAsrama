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
  try {
    if (!input.userId || !input.title || !input.message) {
      console.warn("[createNotification] Missing required fields, skipping.")
      return null
    }

    const notification = await prisma.notification.create({
      data: {
        userId:   input.userId,
        title:    input.title,
        message:  input.message,
        type:     input.type ?? "INFO",
        link:     input.link ?? null,
        // Serialize via JSON.parse/stringify to satisfy Prisma's InputJsonValue constraint
        metadata: input.metadata
          ? JSON.parse(JSON.stringify(input.metadata))
          : undefined,
      },
    })

    return notification.id
  } catch (error) {
    // Fail-open: log error but never throw — caller must not be affected
    logOperationalError({ action: "[createNotification] Failed to create notification:", error: error })
    return null
  }
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
      const notifications = await prisma.notification.findMany({
        where: {
          userId: context.currentUserId,
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id:        true,
          title:     true,
          message:   true,
          type:      true,
          link:      true,
          isRead:    true,
          metadata:  true,
          createdAt: true,
        },
      })

      const unreadCount = await prisma.notification.count({
        where: {
          userId: context.currentUserId,
          isRead: false,
        },
      })

      return { notifications, unreadCount }
    }
  })
}

export async function getNotificationsPaginated(options: { page: number; pageSize: number }) {
  return secureAction({
    module: "Notification",
    action: "getNotificationsPaginated",
    executor: async (context) => {
      const { page, pageSize } = options
      const skip = (page - 1) * pageSize
      const take = pageSize

      const where = {
        userId: context.currentUserId,
      }

      const [total, data] = await prisma.$transaction([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id:        true,
            title:     true,
            message:   true,
            type:      true,
            link:      true,
            isRead:    true,
            metadata:  true,
            createdAt: true,
          },
        })
      ])

      const totalPages = Math.ceil(total / pageSize)

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
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

      // ── Ownership verification (IDOR prevention) ──
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
      })

      if (!notification) {
        throw new Error("Notification not found.")
      }

      if (notification.userId !== context.currentUserId) {
        throw new Error(SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_001)
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data:  { isRead: true },
      })

      revalidatePath("/dashboard")
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

      const result = await prisma.notification.updateMany({
        where: {
          userId: context.currentUserId,
          isRead: false,
        },
        data: { isRead: true },
      })

      revalidatePath("/dashboard")
      return { updated: result.count }
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

      // ── Ownership verification (IDOR prevention) ──
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { userId: true },
      })

      if (!notification) {
        throw new Error("Notification not found.")
      }

      if (notification.userId !== context.currentUserId) {
        throw new Error(SECURITY_CONSTANTS.ERROR_CODES.AUTHZ_001)
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      })

      revalidatePath("/dashboard")
      return {}
    }
  })
}
