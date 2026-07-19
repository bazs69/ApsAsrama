import React from "react"
import { DashboardProps } from "../types"
import WelcomeHeader from "../components/WelcomeHeader"
import StatsSummary from "../components/StatsSummary"
import RecentActivity from "../components/RecentActivity"
import QuickAccess from "../components/QuickAccess"
import BirthdayWidget from "../components/BirthdayWidget"
import { mockRecentActivities } from "../data/recentActivityMockData"

export default function SuperAdminDashboard({ user }: DashboardProps) {
  // Semua aktivitas untuk Super Admin
  const adminActivities = mockRecentActivities

  return (
    <div className="space-y-8">
      <WelcomeHeader user={user} />
      
      {/* 3 Statistik Utama: Total Santri, Tempat Penugasan, Kehadiran */}
      <StatsSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Log Aktivitas */}
        <div className="lg:col-span-2">
          <RecentActivity activities={adminActivities} />
        </div>
        
        {/* Aksi Cepat */}
        <div className="lg:col-span-1">
          <QuickAccess role={user.role || "SUPER_ADMIN"} />
        </div>
      </div>

      <BirthdayWidget />
    </div>
  )
}
