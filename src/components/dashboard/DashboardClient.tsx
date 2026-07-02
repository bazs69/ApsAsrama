"use client"

import React from "react"
import RoleDashboardRenderer from "./beranda/RoleDashboardRenderer"

interface DashboardClientProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role?: string
    satkerId?: string | null
    permissions?: string[]
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  // DashboardClient is now just a lightweight orchestrator/layout container.
  // It delegates rendering entirely to the RoleDashboardRenderer based on user role.
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <RoleDashboardRenderer user={user} />
    </div>
  )
}
