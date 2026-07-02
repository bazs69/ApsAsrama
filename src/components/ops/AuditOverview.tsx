import { MetricCard } from "@/components/ui/MetricCard"
import { ShieldCheck, ShieldAlert, Activity, AlertTriangle, FileText, Calendar } from "lucide-react"
import { ThreatBadge } from "@/components/ops/ThreatBadge"

interface AuditOverviewProps {
  totalEvents: number
  successEvents: number
  failureEvents: number
  criticalEvents: number
  securityEvents: number
  todayEvents: number
}

export function AuditOverview({
  totalEvents,
  successEvents,
  failureEvents,
  criticalEvents,
  securityEvents,
  todayEvents
}: AuditOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <MetricCard 
        title="Total Events" 
        value={totalEvents} 
        icon={FileText} 
        tooltip="Total seluruh riwayat security event yang terekam di database"
      />
      <MetricCard 
        title="Success" 
        value={successEvents} 
        icon={ShieldCheck} 
        tooltip="Jumlah aktivitas user/sistem yang berhasil dilakukan"
      />
      <MetricCard 
        title="Failure" 
        value={failureEvents} 
        icon={AlertTriangle} 
        tooltip="Jumlah aktivitas gagal atau error akses yang terdeteksi"
      />
      <MetricCard 
        title="Critical Events" 
        value={criticalEvents} 
        icon={ShieldAlert} 
        badge={criticalEvents > 0 ? <ThreatBadge level="CRITICAL" /> : undefined}
        tooltip="Jumlah event dengan kategori bahaya atau kegagalan kritis"
      />
      <MetricCard 
        title="Security Events" 
        value={securityEvents} 
        icon={Activity} 
        tooltip="Jumlah kecurigaan atau pelanggaran kebijakan keamanan"
      />
      <MetricCard 
        title="Today's Events" 
        value={todayEvents} 
        icon={Calendar} 
        tooltip="Aktivitas audit yang tercatat pada hari ini"
      />
    </div>
  )
}
