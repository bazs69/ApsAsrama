export type NotificationCategory = "HEALTH" | "SECURITY" | "MONITORING" | "AUDIT" | "RUNTIME" | "SYSTEM"

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export type NotificationSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL"

export interface Notification {
  id: string
  category: NotificationCategory
  title: string
  description: string
  severity: NotificationSeverity
  priority: NotificationPriority
  createdAt: number
  source: string
  actionUrl?: string
  isRead: boolean
}
