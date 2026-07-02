import React from "react"
import { DashboardProps } from "../types"
import WelcomeHeader from "../components/WelcomeHeader"
import PriorityActions from "../components/PriorityActions"
import QuickAccess from "../components/QuickAccess"
import RecentActivity from "../components/RecentActivity"
import AnnouncementPanel from "../components/AnnouncementPanel"
import SystemStatus from "../components/SystemStatus"
import { superAdminPriority } from "../data/priorityMockData"
import { mockRecentActivities } from "../data/recentActivityMockData"
import { getAnnouncementsForRole } from "../data/announcementMockData"

export default function SuperAdminDashboard({ user }: DashboardProps) {
  const adminActivities = mockRecentActivities.filter(a => ["SYSTEM", "SECURITY"].includes(a.category))
  const announcements = getAnnouncementsForRole(user.role || "SUPER_ADMIN")

  return (
    <div className="space-y-8">
      <WelcomeHeader user={user} />
      <PriorityActions actions={superAdminPriority} />

      {/* Activity + Quick Access & Announcement + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <RecentActivity activities={adminActivities} />
        </div>
        <div className="lg:col-span-4">
          <QuickAccess role={user.role || "SUPER_ADMIN"} />
        </div>

        <div className="lg:col-span-8">
          <AnnouncementPanel announcements={announcements} />
        </div>
        <div className="lg:col-span-4">
          <SystemStatus />
        </div>
      </div>
    </div>
  )
}
