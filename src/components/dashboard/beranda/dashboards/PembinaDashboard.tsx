import React from "react"
import { DashboardProps, PriorityAction } from "../types"
import WelcomeHeader from "../components/WelcomeHeader"
import PriorityActions from "../components/PriorityActions"
import QuickAccess from "../components/QuickAccess"
import RecentActivity from "../components/RecentActivity"
import AnnouncementPanel from "../components/AnnouncementPanel"
import { mockRecentActivities } from "../data/recentActivityMockData"
import { getAnnouncementsForRole } from "../data/announcementMockData"

export default function PembinaDashboard({ user }: DashboardProps) {
  const priorityActions: PriorityAction[] = []
  const activities = mockRecentActivities.filter(a => ["ASSIGNMENT", "MONITORING"].includes(a.category))
  const announcements = getAnnouncementsForRole(user.role || "PEMBINA")

  return (
    <div className="space-y-8">
      <WelcomeHeader user={user} />
      <PriorityActions actions={priorityActions} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <RecentActivity activities={activities} />
        </div>
        <div className="lg:col-span-4">
          <QuickAccess role={user.role || "PEMBINA"} />
        </div>

        <div className="lg:col-span-8">
          <AnnouncementPanel announcements={announcements} />
        </div>
      </div>
    </div>
  )
}
