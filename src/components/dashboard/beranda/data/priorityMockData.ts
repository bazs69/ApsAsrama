import { AlertCircle, UserCheck, ClipboardList } from "lucide-react"
import { PriorityAction } from "../types"

export const superAdminPriority: PriorityAction[] = [
  {
    id: "1",
    title: "System Update",
    description: "Database maintenance requires attention in 2 hours.",
    severity: "warning",
    actionLabel: "View Details",
    actionHref: "/dashboard/settings",
    icon: AlertCircle,
    isCritical: true,
    dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    title: "New Registrations",
    description: "3 new users are waiting for role approval.",
    severity: "info",
    actionLabel: "Review Users",
    actionHref: "/dashboard/role-user",
    icon: UserCheck,
    count: 3
  }
]

export const satkerPriority: PriorityAction[] = [
  {
    id: "1",
    title: "Laporan Mingguan",
    description: "Laporan minggu ini belum disubmit.",
    severity: "danger",
    actionLabel: "Buat Laporan",
    actionHref: "/dashboard/assignments",
    icon: ClipboardList,
    isCritical: true
  }
]
