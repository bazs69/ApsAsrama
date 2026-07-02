import type { Notification, NotificationCategory } from "./notificationTypes"

export function groupByCategory(notifications: Notification[]): Record<NotificationCategory, Notification[]> {
  const groups: Record<NotificationCategory, Notification[]> = {
    HEALTH: [],
    SECURITY: [],
    MONITORING: [],
    AUDIT: [],
    RUNTIME: [],
    SYSTEM: []
  }
  
  for (const n of notifications) {
    if (groups[n.category]) {
      groups[n.category].push(n)
    }
  }
  
  return groups
}

export function countUnread(notifications: Notification[]): number {
  return notifications.filter(n => !n.isRead).length
}

export function countCritical(notifications: Notification[]): number {
  return notifications.filter(n => n.priority === "CRITICAL").length
}

export function countWarnings(notifications: Notification[]): number {
  return notifications.filter(n => n.severity === "WARNING").length
}

export function sortByPriority(notifications: Notification[]): Notification[] {
  const priorityWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  return [...notifications].sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority]
    }
    return b.createdAt - a.createdAt
  })
}

export function sortByNewest(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => b.createdAt - a.createdAt)
}

export function filterUnread(notifications: Notification[]): Notification[] {
  return notifications.filter(n => !n.isRead)
}

export function filterCritical(notifications: Notification[]): Notification[] {
  return notifications.filter(n => n.priority === "CRITICAL")
}
