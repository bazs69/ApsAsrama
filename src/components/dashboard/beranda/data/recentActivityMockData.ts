import { RecentActivityItem } from "../types"

export const mockRecentActivities: RecentActivityItem[] = [
  {
    id: "act-1",
    title: "Tugas Diverifikasi",
    description: "Laporan Kebersihan Asrama telah diverifikasi oleh Pembina.",
    category: "ASSIGNMENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    actor: "Ust. Fulan",
  },
  {
    id: "act-2",
    title: "Absensi Diinput",
    description: "Kehadiran Kajian Subuh telah selesai diinput.",
    category: "ABSENSI",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    actor: "Ust. Ahmad",
    meta: "Hadir: 145/150"
  },
  {
    id: "act-3",
    title: "Login Gagal Terdeteksi",
    description: "Percobaan login gagal melebihi batas dari IP tak dikenal.",
    category: "SECURITY",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: "act-4",
    title: "Sinkronisasi Data",
    description: "Sinkronisasi database dengan server pusat berhasil.",
    category: "SYSTEM",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  }
]
