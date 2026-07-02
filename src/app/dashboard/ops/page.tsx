import { OpsCard } from "@/components/ops/OpsCard"
import {
  Activity,
  HeartPulse,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  BellRing
} from "lucide-react"

export default function OpsOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <OpsCard
          title="Health Platform"
          description="Real-time system health checks, database status, memory usage, and node environment diagnostics."
          icon={HeartPulse}
          href="/dashboard/ops/health"
        />
        <OpsCard
          title="Monitoring"
          description="Traffic analysis, request success rates, slow queries, and API response times."
          icon={Activity}
          href="/dashboard/ops/monitoring"
        />
        <OpsCard
          title="Security Center"
          description="Threat detection, failed logins, rate limiters, and brute force protection metrics."
          icon={ShieldAlert}
          href="/dashboard/ops/security"
        />
        <OpsCard
          title="Audit Trail"
          description="Immutable timeline of all user and system activities, configuration changes, and access logs."
          icon={ShieldCheck}
          href="/dashboard/ops/audit"
        />
        <OpsCard
          title="Runtime Engine"
          description="Node.js process metrics, heap allocation, RSS tracking, and historical rolling windows."
          icon={Cpu}
          href="/dashboard/ops/runtime"
        />
        <OpsCard
          title="Notifications"
          description="Aggregated alerts, critical errors, security warnings, and health degradations."
          icon={BellRing}
          href="/dashboard/ops/notifications"
        />
      </div>
    </div>
  )
}
