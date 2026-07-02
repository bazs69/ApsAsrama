import { LucideIcon, Users, Settings, ClipboardList, Shield, Calendar, Activity, BookOpen, AlertCircle } from "lucide-react"

export interface QuickAccessItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  colorClass: string;
}

export const quickAccessByRole: Record<string, QuickAccessItem[]> = {
  SUPER_ADMIN: [
    { id: "1", label: "User Management", href: "/dashboard/role-user", icon: Users, colorClass: "text-primary-600 dark:text-primary-400 bg-primary-500/10 border-primary-500/20" },
    { id: "2", label: "System Settings", href: "/dashboard/settings", icon: Settings, colorClass: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
    { id: "3", label: "Audit Logs", href: "/dashboard/audit", icon: Shield, colorClass: "text-warning-600 dark:text-warning-400 bg-warning-500/10 border-warning-500/20" }
  ],
  PEMBINA: [
    { id: "1", label: "Laporan Satker", href: "/dashboard/assignments", icon: ClipboardList, colorClass: "text-primary-600 dark:text-primary-400 bg-primary-500/10 border-primary-500/20" },
    { id: "2", label: "Rekap Absensi", href: "/dashboard/attendance", icon: Calendar, colorClass: "text-info-600 dark:text-info-400 bg-info-500/10 border-info-500/20" },
    { id: "3", label: "Direktori Pengurus", href: "/dashboard/residents", icon: Users, colorClass: "text-success-600 dark:text-success-400 bg-success-500/10 border-success-500/20" }
  ],
  PENGURUS_KBM: [
    { id: "1", label: "Input Absensi Kegiatan", href: "/dashboard/attendance/new", icon: BookOpen, colorClass: "text-primary-600 dark:text-primary-400 bg-primary-500/10 border-primary-500/20" },
    { id: "2", label: "Input Absensi Apel", href: "/dashboard/attendance/apel", icon: ClipboardList, colorClass: "text-info-600 dark:text-info-400 bg-info-500/10 border-info-500/20" },
    { id: "3", label: "Jadwal Muallim", href: "/dashboard/schedule", icon: Calendar, colorClass: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20" }
  ],
  PENGURUS_PENUGASAN: [
    { id: "1", label: "Buat Penugasan", href: "/dashboard/assignments/new", icon: ClipboardList, colorClass: "text-primary-600 dark:text-primary-400 bg-primary-500/10 border-primary-500/20" },
    { id: "2", label: "Monitoring Penugasan", href: "/dashboard/monitoring", icon: Activity, colorClass: "text-info-600 dark:text-info-400 bg-info-500/10 border-info-500/20" },
    { id: "3", label: "Evaluasi Kinerja", href: "/dashboard/evaluation", icon: AlertCircle, colorClass: "text-warning-600 dark:text-warning-400 bg-warning-500/10 border-warning-500/20" }
  ],
  KEPALA_SATKER: [
    { id: "1", label: "Update Progress Tugas", href: "/dashboard/assignments/progress", icon: Activity, colorClass: "text-primary-600 dark:text-primary-400 bg-primary-500/10 border-primary-500/20" },
    { id: "2", label: "Laporan Mingguan", href: "/dashboard/assignments/report", icon: ClipboardList, colorClass: "text-success-600 dark:text-success-400 bg-success-500/10 border-success-500/20" }
  ]
}
