import { Announcement, SystemStatusData } from "../types"

// -----------------------------------
// ANNOUNCEMENT MOCK DATA
// -----------------------------------

const allAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Jadwal Maintenance Server",
    content: "Server akan mengalami downtime terjadwal pada hari Minggu, 06 Juli 2026 pukul 01.00 – 04.00 WIB. Harap simpan semua pekerjaan sebelum waktu tersebut.",
    priority: "urgent",
    publishedAt: new Date("2026-07-01T07:00:00").toISOString(),
    expiresAt: new Date("2026-07-06T04:00:00").toISOString(),
    author: "Tim IT",
    targetRoles: ["SUPER_ADMIN"],
    actionLabel: "Detail Jadwal",
    actionHref: "/dashboard/settings"
  },
  {
    id: "ann-2",
    title: "Jadwal Evaluasi Bulanan",
    content: "Evaluasi bulanan seluruh satker akan dilaksanakan pada tanggal 10 Juli 2026. Pastikan laporan sudah disubmit sebelum evaluasi dimulai.",
    priority: "important",
    publishedAt: new Date("2026-07-01T08:00:00").toISOString(),
    author: "Pembina",
    targetRoles: ["PEMBINA", "KEPALA_SATKER"]
  },
  {
    id: "ann-3",
    title: "Perubahan Jadwal Apel",
    content: "Jadwal apel pagi diubah dari pukul 06.00 menjadi pukul 05.45 WIB efektif mulai Senin, 07 Juli 2026.",
    priority: "important",
    publishedAt: new Date("2026-07-01T09:00:00").toISOString(),
    author: "Sekretariat",
    targetRoles: ["PENGURUS_KBM", "PENGURUS_PENUGASAN", "KEPALA_SATKER"]
  },
  {
    id: "ann-4",
    title: "Backup Database Mingguan",
    content: "Backup database otomatis berjalan setiap Sabtu pukul 23.00 WIB. Hindari operasi berat di jam tersebut.",
    priority: "normal",
    publishedAt: new Date("2026-07-01T06:00:00").toISOString(),
    author: "Tim IT",
    targetRoles: ["SUPER_ADMIN"]
  },
  {
    id: "ann-5",
    title: "Deadline Laporan Satker Juli",
    content: "Batas akhir pengiriman laporan bulanan Satker untuk bulan Juli adalah tanggal 31 Juli 2026.",
    priority: "urgent",
    publishedAt: new Date("2026-07-01T07:30:00").toISOString(),
    expiresAt: new Date("2026-07-31T23:59:00").toISOString(),
    author: "Pembina",
    targetRoles: ["KEPALA_SATKER"]
  }
]

export function getAnnouncementsForRole(role: string): Announcement[] {
  const normalizedRole = role.toUpperCase()
  const mappedRole = normalizedRole === "ADMIN" ? "SUPER_ADMIN" : normalizedRole
  const now = new Date()
  return allAnnouncements.filter(ann => {
    // Check expiry
    if (ann.expiresAt && new Date(ann.expiresAt) < now) return false
    // Show to all if no targetRoles, otherwise filter
    if (!ann.targetRoles || ann.targetRoles.length === 0) return true
    return ann.targetRoles.includes(mappedRole)
  })
}

// -----------------------------------
// SYSTEM STATUS MOCK DATA
// -----------------------------------

export const mockSystemStatus: SystemStatusData = {
  database: "online",
  notification: "online",
  authentication: "online",
  lastSync: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
  appVersion: "1.0.0"
}
