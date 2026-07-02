import { SectionHeader } from "@/components/ui/SectionHeader"
import { getSecuritySummary } from "@/lib/security/ui/securityUIHelper"
import { MetricCard } from "@/components/ui/MetricCard"
import { MonitoringCard } from "@/components/ops/MonitoringCard"
import { SecurityMetricCard } from "@/components/ops/SecurityMetricCard"
import { SecurityRecommendation } from "@/components/ops/SecurityRecommendation"
import { ThreatBadge } from "@/components/ops/ThreatBadge"
import { ThreatCard } from "@/components/ops/ThreatCard"
import { ThreatTimelineItem } from "@/components/ops/ThreatTimelineItem"
import { RefreshButton } from "@/components/ops/RefreshButton"
import {
  ShieldAlert,
  Lock,
  Fingerprint,
  AlertTriangle,
  Ban,
  Repeat,
  ShieldX,
  UserX,
  Activity,
  ShieldCheck,
} from "lucide-react"

export const dynamic = "force-dynamic"


export default function SecurityDashboardPage() {
  let summary = null
  let loadError = false

  try {
    summary = getSecuritySummary()
  } catch {
    loadError = true
  }

  if (loadError || !summary) {
    return (
      <div className="py-16 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">Gagal memuat data keamanan.</p>
      </div>
    )
  }

  const { metrics, recentSecurityEvents, threatLevel, recommendations } = summary

  // Determine max values for progress bars (soft cap = 20 unless value exceeds)
  const safeMax = (v: number) => Math.max(v, 20)

  // Derive top threat sources from recent events by parsing message strings
  const sourceCounts: Record<string, number> = {}
  for (const e of recentSecurityEvents) {
    const match = e.message.match(/Security \[.+?\]: (.+?)::/)
    const src = match ? match[1] : e.category
    sourceCounts[src] = (sourceCounts[src] ?? 0) + 1
  }
  const topSources = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-8">

      {/* Header */}
      <SectionHeader 
        title="Threat Intelligence Center"
        description="Real-time security telemetry from Enterprise Security Layer"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Threat Level:</span>
              <ThreatBadge level={threatLevel} />
            </div>
            <RefreshButton />
          </div>
        }
      />

      {/* 1. Security Overview — Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Threat Level"
          value={threatLevel}
          icon={ShieldAlert}
          badge={<ThreatBadge level={threatLevel} />}
        />
        <MetricCard title="Failed Login" value={metrics.failedLogin} icon={Lock} />
        <MetricCard title="Rate Limit Hits" value={metrics.rateLimitHit} icon={Ban} />
        <MetricCard title="CSRF Failures" value={metrics.csrfFailure} icon={Fingerprint} />
        <MetricCard title="Replay Attempts" value={metrics.replayRejected} icon={Repeat} />
        <MetricCard title="Brute Force" value={metrics.bruteForceBlocked} icon={UserX} />
      </div>

      {/* Layout: Main (2/3) + Sidebar (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main Column ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* 4. Security Metrics with Progress Bars */}
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Security Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <SecurityMetricCard
                title="Failed Login"
                value={metrics.failedLogin}
                max={safeMax(metrics.failedLogin)}
                icon={Lock}
                dangerThreshold={10}
                warningThreshold={3}
                unit="attempts"
              />
              <SecurityMetricCard
                title="CSRF Failures"
                value={metrics.csrfFailure}
                max={safeMax(metrics.csrfFailure)}
                icon={Fingerprint}
                dangerThreshold={5}
                warningThreshold={1}
                unit="failures"
              />
              <SecurityMetricCard
                title="Replay Rejected"
                value={metrics.replayRejected}
                max={safeMax(metrics.replayRejected)}
                icon={Repeat}
                dangerThreshold={1}
                unit="rejections"
              />
              <SecurityMetricCard
                title="Rate Limit Hits"
                value={metrics.rateLimitHit}
                max={safeMax(metrics.rateLimitHit)}
                icon={Ban}
                dangerThreshold={20}
                warningThreshold={10}
                unit="hits"
              />
              <SecurityMetricCard
                title="Brute Force Blocked"
                value={metrics.bruteForceBlocked}
                max={safeMax(metrics.bruteForceBlocked)}
                icon={ShieldX}
                dangerThreshold={1}
                unit="blocks"
              />
              <SecurityMetricCard
                title="Permission Denied"
                value={metrics.permissionDenied}
                max={safeMax(metrics.permissionDenied)}
                icon={AlertTriangle}
                dangerThreshold={5}
                warningThreshold={2}
                unit="denials"
              />
            </div>
          </div>

          {/* 5. Recent Security Events */}
          <MonitoringCard title="Recent Security Events" icon={Activity}>
            {recentSecurityEvents.length > 0 ? (
              <div className="space-y-3">
                {recentSecurityEvents.map((ev, i) => (
                  <ThreatCard
                    key={i}
                    title={ev.category}
                    severity={
                      ev.severity === "critical" ? "CRITICAL"
                        : ev.severity === "error" ? "HIGH"
                        : ev.severity === "warning" ? "MEDIUM"
                        : "LOW"
                    }
                    description={ev.message}
                    timestamp={ev.timestamp}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-success-500" />
                Tidak ada security event yang direkam.
              </div>
            )}
          </MonitoringCard>

        </div>

        {/* ── Sidebar Column ──────────────────────────── */}
        <div className="space-y-8">

          {/* 3. Threat Timeline */}
          <MonitoringCard title="Threat Timeline" icon={ShieldAlert}>
            {recentSecurityEvents.length > 0 ? (
              <div className="pt-2">
                {recentSecurityEvents.slice(0, 8).map((ev, i) => (
                  <ThreatTimelineItem
                    key={i}
                    time={new Date(ev.timestamp).toLocaleTimeString()}
                    severity={
                      ev.severity === "critical" ? "CRITICAL"
                        : ev.severity === "error" ? "HIGH"
                        : ev.severity === "warning" ? "MEDIUM"
                        : "LOW"
                    }
                    source={ev.category}
                    description={ev.message}
                    isLast={i === Math.min(recentSecurityEvents.length, 8) - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No threat events recorded.
              </div>
            )}
          </MonitoringCard>

          {/* 6. Top Threat Sources */}
          <MonitoringCard title="Top Threat Sources" icon={UserX}>
            {topSources.length > 0 ? (
              <div className="space-y-3">
                {topSources.map(([source, count], i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 text-xs font-bold rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{source}</span>
                    </div>
                    <span className="text-sm font-bold text-danger-600 dark:text-danger-400">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                No threat sources identified.
              </div>
            )}
          </MonitoringCard>

          {/* 7. Security Recommendations */}
          <SecurityRecommendation recommendations={recommendations} />

        </div>
      </div>
    </div>
  )
}
