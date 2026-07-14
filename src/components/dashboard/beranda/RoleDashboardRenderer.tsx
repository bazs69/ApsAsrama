import React from "react"
import SuperAdminDashboard from "./dashboards/SuperAdminDashboard"
import PembinaDashboard from "./dashboards/PembinaDashboard"
import KBMDashboard from "./dashboards/KBMDashboard"
import AssignmentDashboard from "./dashboards/AssignmentDashboard"
import SatkerDashboard from "./dashboards/SatkerDashboard"

interface RoleDashboardRendererProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role?: string
    satkerId?: string | null
    permissions?: string[]
  }
}

export default function RoleDashboardRenderer({ user }: RoleDashboardRendererProps) {
  const role = user.role?.toUpperCase() || ""

  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN": // Sometimes mapped as ADMIN
      return <SuperAdminDashboard user={user} />

    case "PEMBINA":
      return <PembinaDashboard user={user} />

    case "PENGURUS_KBM":
      return <KBMDashboard user={user} />

    case "PENGURUS_PENUGASAN":
      return <AssignmentDashboard user={user} />

    case "KEPALA_SATKER":
      return <SatkerDashboard user={user} />

    default:
      // Fallback
      return (
        <div className="flex items-center justify-center h-64 glass rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">Dashboard tidak tersedia untuk role Anda ({role || "Tanpa Role"}).</p>
        </div>
      )
  }
}
