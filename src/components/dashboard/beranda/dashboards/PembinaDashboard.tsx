import React from "react"
import { DashboardProps } from "../types"
import WelcomeHeader from "../components/WelcomeHeader"
import StatsSummary from "../components/StatsSummary"
import RecentActivity from "../components/RecentActivity"
import BirthdayWidget from "../components/BirthdayWidget"
import { mockRecentActivities } from "../data/recentActivityMockData"

export default function PembinaDashboard({ user }: DashboardProps) {
  const activities = mockRecentActivities.filter(a => ["MONITORING", "ABSENSI"].includes(a.category))

  return (
    <div className="space-y-8">
      <WelcomeHeader user={user} />
      
      {/* 3 Statistik Utama: Total Santri, Tempat Penugasan, Kehadiran */}
      <StatsSummary />

      <div className="grid grid-cols-1 gap-8">
        {/* Log Aktivitas */}
        <div className="col-span-1">
          <RecentActivity activities={activities} />
        </div>
      </div>

      <BirthdayWidget />
    </div>
  )
}
