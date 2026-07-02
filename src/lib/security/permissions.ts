/**
 * Centralized Permission Constants
 *
 * Single source of truth for all permission codes used across the application.
 * Replace hardcoded permission strings with these constants to ensure
 * consistency and enable IDE autocompletion.
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // Santri (Residents)
  SANTRI_VIEW: "santri.view",
  SANTRI_UPDATE: "santri.update",

  // Muallim
  MUALLIM_VIEW: "muallim.view",

  // Penugasan (Assignments)
  PENUGASAN_VIEW: "penugasan.view",

  // Monitoring
  MONITORING_VIEW: "monitoring.view",

  // Absensi (Attendance)
  ABSENSI_VIEW: "absensi.view",

  // Area
  AREA_VIEW: "area.view",

  // Akademik
  AKADEMIK_VIEW: "akademik.view",

  // KBM
  KBM_VIEW: "kbm.view",

  // Role & Permissions
  ROLE_VIEW: "role.view",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  // Satker
  SATKER_VIEW: "satker.view",

  // Pengaturan (Settings)
  PENGATURAN_VIEW: "pengaturan.view",
  PENGATURAN_CREATE: "pengaturan.create",
  PENGATURAN_UPDATE: "pengaturan.update",
  PENGATURAN_DELETE: "pengaturan.delete",

  // Laporan (Reports)
  LAPORAN_VIEW: "laporan.view",

  // Formulir (Forms)
  FORMULIR_VIEW: "formulir.view",

  // Wilayah (Region Reference)
  WILAYAH_VIEW: "wilayah.view",
  WILAYAH_CREATE: "wilayah.create",
  WILAYAH_UPDATE: "wilayah.update",
  WILAYAH_DELETE: "wilayah.delete",

  // Audit Log
  AUDIT_VIEW: "audit.view",
} as const

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
