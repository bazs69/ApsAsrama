import { MetricCard } from "@/components/ui/MetricCard"
import { Bell, BellDot, AlertOctagon, AlertTriangle } from "lucide-react"

interface NotificationOverviewProps {
  total: number
  unread: number
  critical: number
  warnings: number
}

export function NotificationOverview({ total, unread, critical, warnings }: NotificationOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard 
        title="Total Notifications" 
        value={total} 
        icon={Bell} 
        tooltip="Jumlah seluruh alert operasional yang tercatat dalam sistem"
      />
      <MetricCard 
        title="Unread Alerts" 
        value={unread} 
        icon={BellDot} 
        tooltip="Alert belum dibaca yang memerlukan penanganan atau review admin"
      />
      <MetricCard 
        title="Critical Alerts" 
        value={critical} 
        icon={AlertOctagon} 
        tooltip="Alert tingkat kritis tinggi yang butuh tindakan segera"
      />
      <MetricCard 
        title="Warnings" 
        value={warnings} 
        icon={AlertTriangle} 
        tooltip="Alert peringatan non-kritis mengenai kondisi subsistem"
      />
    </div>
  )
}
