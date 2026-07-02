import React from "react"
import { DashboardProps } from "../types"
import WelcomeHeader from "../components/WelcomeHeader"
import PriorityActions from "../components/PriorityActions"
import QuickAccess from "../components/QuickAccess"
import RecentActivity from "../components/RecentActivity"
import AnnouncementPanel from "../components/AnnouncementPanel"
import { satkerPriority } from "../data/priorityMockData"
import { mockRecentActivities } from "../data/recentActivityMockData"
import { getAnnouncementsForRole } from "../data/announcementMockData"

export default function SatkerDashboard({ user }: DashboardProps) {
  const activities = mockRecentActivities.filter(a => ["ASSIGNMENT"].includes(a.category))
  const announcements = getAnnouncementsForRole(user.role || "KEPALA_SATKER")

  return (
    <div className="space-y-8">
      <WelcomeHeader user={user} />
      <PriorityActions actions={satkerPriority} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <RecentActivity activities={activities} />
        </div>
        <div className="lg:col-span-4">
          <QuickAccess role={user.role || "SATKER"} />
        </div>

        <div className="lg:col-span-8">
          <AnnouncementPanel announcements={announcements} />
        </div>
      </div>
    </div>
  )
}
