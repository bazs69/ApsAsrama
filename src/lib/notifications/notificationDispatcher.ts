/**
 * Notification Dispatcher
 * 
 * Abstraction layer for sending notifications.
 * It is currently synchronous to adhere to Zero Regression rules.
 * 
 * Implementasi saat ini menggunakan pemanggilan fungsi lokal dan siap diganti BullMQ 
 * tanpa perubahan pada Business Layer di Production V2.
 */
import { createNotification } from "@/app/actions/notifications"
import type { CreateNotificationInput } from "@/app/actions/notifications"

export async function dispatchNotification(payload: CreateNotificationInput): Promise<void> {
  // Production V2: await bullmq.add("notification-queue", payload)
  await createNotification(payload)
}
