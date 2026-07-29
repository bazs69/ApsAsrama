"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ClipboardList,
  Briefcase,
  ChevronDown,
  CalendarCheck,
  BookOpen,
  Flag,
  Database,
  GraduationCap,
  Map,
  MapPin,
  FileText,
  Activity,
  ShieldCheck,
  HeartPulse,
  ShieldAlert,
  Cpu,
  BedDouble,
  BellRing
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useState } from "react"

const dataMasterSubLinks = [
  { href: "/dashboard/residents", label: "Santri", icon: Users },
  { href: "/dashboard/pengurus", label: "Pengurus", icon: Briefcase }
]

const absensiSubLinks = [
  { href: "/dashboard/absensi/muallim", label: "Absensi Muallim", icon: BookOpen },
  { href: "/dashboard/absensi/kegiatan", label: "Absensi Kegiatan", icon: CalendarCheck },
  { href: "/dashboard/absensi/apel", label: "Absensi Apel", icon: Flag },
]

function getReferensiSubLinks(permissions: string[]) {
  const hasPerm = (action: string) => permissions.includes(action.toLowerCase());
  const links = [];
  if (hasPerm("wilayah.view")) links.push({ href: "/dashboard/referensi/wilayah", label: "Wilayah Administratif", icon: MapPin });
  if (hasPerm("area.view")) links.push({ href: "/dashboard/area", label: "Area Pondok", icon: Map });
  if (hasPerm("akademik.view")) links.push({ href: "/dashboard/akademik", label: "Akademik", icon: GraduationCap });
  if (hasPerm("kbm.view")) links.push({ href: "/dashboard/kbm", label: "KBM", icon: BookOpen });
  if (hasPerm("role.view")) links.push({ href: "/dashboard/role-user", label: "Role & Hak Akses", icon: Users });
  if (hasPerm("satker.view")) links.push({ href: "/dashboard/assignments/satkers", label: "Satuan Kerja", icon: Briefcase });
  if (hasPerm("muallim.view")) links.push({ href: "/dashboard/muallim", label: "Muallim", icon: GraduationCap });
  return links;
}



function AbsensiDropdown({ pathname }: { pathname: string }) {
  const isAbsensiActive = absensiSubLinks.some((l) => pathname === l.href)
  const [isOpen, setIsOpen] = useState(isAbsensiActive)

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all cursor-pointer ${isAbsensiActive
          ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
          : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
          }`}
      >
        <div className="flex items-center space-x-3">
          <CalendarCheck
            className={`w-4 h-4 ${isAbsensiActive ? "text-primary-700 dark:text-primary-400" : ""}`}
          />
          <span className="font-semibold">Absensi</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
      >
        <div className="ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-1">
          {absensiSubLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all text-sm ${isActive
                  ? "bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-500/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent font-medium"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}



function DataMasterDropdown({ pathname }: { pathname: string }) {
  const isDataMasterActive = dataMasterSubLinks.some((l) => pathname === l.href)
  const [isOpen, setIsOpen] = useState(isDataMasterActive)

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all cursor-pointer ${isDataMasterActive
          ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
          : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
          }`}
      >
        <div className="flex items-center space-x-3">
          <Database
            className={`w-4 h-4 ${isDataMasterActive ? "text-primary-700 dark:text-primary-400" : ""}`}
          />
          <span className="font-semibold">Data Master</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
      >
        <div className="ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-1">
          {dataMasterSubLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all text-sm ${isActive
                  ? "bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-500/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent font-medium"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ReferensiDropdown({ pathname, permissions }: { pathname: string, permissions: string[] }) {
  const links = getReferensiSubLinks(permissions);
  const isReferensiActive = links.some((l) => pathname === l.href)
  const [isOpen, setIsOpen] = useState(isReferensiActive)

  if (links.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all cursor-pointer ${isReferensiActive
          ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
          : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
          }`}
      >
        <div className="flex items-center space-x-3">
          <Database
            className={`w-4 h-4 ${isReferensiActive ? "text-primary-700 dark:text-primary-400" : ""}`}
          />
          <span className="font-semibold">Referensi</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
      >
        <div className="ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all text-sm ${isActive
                  ? "bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-500/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent font-medium"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Operational Center Dropdown ────────────────────────────────────────────────

const opsSubLinks = [
  { href: "/dashboard/ops", label: "Overview", icon: Activity },
  { href: "/dashboard/ops/health", label: "Health", icon: HeartPulse },
  { href: "/dashboard/ops/monitoring", label: "Monitoring", icon: Activity },
  { href: "/dashboard/ops/security", label: "Security", icon: ShieldAlert },
  { href: "/dashboard/ops/audit", label: "Audit", icon: ShieldCheck },
  { href: "/dashboard/ops/runtime", label: "Runtime", icon: Cpu },
  { href: "/dashboard/ops/notifications", label: "Notifications", icon: BellRing },
]

function OpsDropdown({ pathname }: { pathname: string }) {
  const isActive = opsSubLinks.some((l) => pathname === l.href) || pathname.startsWith("/dashboard/ops")
  const [isOpen, setIsOpen] = useState(isActive)

  return (
    <div>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all cursor-pointer ${isActive
          ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
          : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
          }`}
      >
        <div className="flex items-center space-x-3">
          <Activity
            className={`w-4 h-4 ${isActive ? "text-primary-700 dark:text-primary-400" : ""}`}
          />
          <span className="font-semibold">Operational Center</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
          }`}
      >
        <div className="ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-1">
          {opsSubLinks.map((link) => {
            const Icon = link.icon
            const isLinkActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all text-sm ${isLinkActive
                  ? "bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-500/20"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent font-medium"
                  }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function Sidebar({ userRole, permissions = [] }: { userRole?: string, permissions?: string[] }) {
  const pathname = usePathname()

  const hasPerm = (action: string) => permissions.includes(action.toLowerCase())

  const showBeranda = hasPerm("dashboard.view")
  const showFormulir = hasPerm("formulir.view")
  const showDataMaster = hasPerm("santri.view") || hasPerm("pengurus.view")
  const showPenugasanSantri = hasPerm("penugasan.view")
  const showMonitoringPenugasan = hasPerm("monitoring.view")
  const showAbsensi = hasPerm("absensi.view")
  const showReferensi = hasPerm("wilayah.view") || hasPerm("area.view") || hasPerm("akademik.view") || hasPerm("kbm.view") || hasPerm("role.view") || hasPerm("satker.view") || hasPerm("muallim.view")
  const showPengaturan = hasPerm("pengaturan.view")
  const showAuditLog = hasPerm("audit.view")
  const showSatkerSantri = userRole === "KEPALA_SATKER"

  const isAssignmentActive = pathname === "/dashboard/assignments" || pathname === "/dashboard/monitoring-penugasan"

  const [isUnitPenugasanOpen, setIsUnitPenugasanOpen] = useState(isAssignmentActive)

  const topLinks = [
    ...(showBeranda ? [{ href: "/dashboard", label: "Beranda", icon: LayoutDashboard }] : []),
    ...(showFormulir ? [{ href: "/dashboard/formulir", label: "Formulir", icon: FileText }] : []),
  ]

  const bottomLinks = [
    ...(showPengaturan ? [{ href: "/dashboard/settings", label: "Pengaturan", icon: Settings }] : []),
  ]

  return (
    <div className="flex flex-col h-full py-6">
      <div className="flex items-center space-x-3 px-6 mb-6">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center drop-shadow-md">
          <Image src="/logo.png" alt="SPThree Connect Logo" width={48} height={48} className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col justify-center leading-tight">
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
            SPThree
          </span>
          <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase mt-0.5">
            Connect
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {topLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-2.5 text-sm rounded-xl transition-all ${isActive
                ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-700 dark:text-primary-400" : ""}`} />
              <span className="font-semibold">{link.label}</span>
            </Link>
          )
        })}

        {showDataMaster && <DataMasterDropdown pathname={pathname} />}

        {showSatkerSantri && (
          <Link
            href="/dashboard/satker-santri"
            className={`flex items-center space-x-3 px-4 py-2.5 text-sm rounded-xl transition-all ${pathname === "/dashboard/satker-santri"
              ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
              }`}
          >
            <Users className={`w-4 h-4 ${pathname === "/dashboard/satker-santri" ? "text-primary-700 dark:text-primary-400" : ""}`} />
            <span className="font-semibold">Data Santri Satker</span>
          </Link>
        )}

        <div>
          <button
            onClick={() => setIsUnitPenugasanOpen((prev) => !prev)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all cursor-pointer ${isAssignmentActive
              ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
              }`}
          >
            <div className="flex items-center space-x-3">
              <ClipboardList
                className={`w-4 h-4 ${isAssignmentActive ? "text-primary-700 dark:text-primary-400" : ""}`}
              />
              <span className="font-semibold">Unit Penugasan</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isUnitPenugasanOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isUnitPenugasanOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
              }`}
          >
            <div className="ml-4 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-1">
              {showPenugasanSantri && (
                <Link
                  href="/dashboard/assignments"
                  className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all text-sm ${pathname === "/dashboard/assignments"
                    ? "bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-500/20"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent font-medium"
                    }`}
                >
                  <ClipboardList className="w-4 h-4 flex-shrink-0" />
                  <span>Penugasan Santri</span>
                </Link>
              )}
              {showMonitoringPenugasan && (
                <Link
                  href="/dashboard/monitoring-penugasan"
                  className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl transition-all text-sm ${pathname === "/dashboard/monitoring-penugasan"
                    ? "bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold border border-primary-500/20"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent font-medium"
                    }`}
                >
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span>Monitoring Penugasan</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {showAbsensi && <AbsensiDropdown pathname={pathname} />}
        {showReferensi && <ReferensiDropdown pathname={pathname} permissions={permissions} />}
        {showAuditLog && <OpsDropdown pathname={pathname} />}

        {showAuditLog && (
          <Link
            href="/dashboard/audit-logs"
            className={`flex items-center space-x-3 px-4 py-2.5 text-sm rounded-xl transition-all ${pathname === "/dashboard/audit-logs"
              ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/25"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
              }`}
          >
            <ShieldCheck className={`w-4 h-4 ${pathname === "/dashboard/audit-logs" ? "text-violet-600 dark:text-violet-400" : ""}`} />
            <span className="font-semibold">Audit Log</span>
          </Link>
        )}

        {bottomLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-2.5 text-sm rounded-xl transition-all ${isActive
                ? "bg-gradient-to-r from-primary-500/15 to-transparent border-l-4 border-l-primary-500 border-y border-r border-transparent text-primary-700 dark:text-primary-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200 border-l-4 border-transparent"
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-700 dark:text-primary-400" : ""}`} />
              <span className="font-semibold">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 mt-auto pt-4 pb-6">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-red-50 dark:bg-red-900/200/10 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all border border-transparent"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-semibold">Keluar (Sign Out)</span>
        </button>
      </div>
    </div>
  )
}
