import { SectionHeader } from "@/components/ui/SectionHeader"
import { getSystemStatus } from "@/lib/health/healthReporter"
import { StatusBadge } from "@/components/ops/StatusBadge"
import { HealthCard } from "@/components/ops/HealthCard"
import { MetricCard } from "@/components/ui/MetricCard"
import { RefreshButton } from "@/components/ops/RefreshButton"
import EmptyState from "@/components/ui/EmptyState"
import { Cpu, MemoryStick, Database, Server, Clock, Activity, ShieldCheck, Box } from "lucide-react"

export const dynamic = "force-dynamic" // Ensure fresh data on every request

export default async function HealthDashboardPage() {
  let status = null
  let loadError = false

  try {
    status = await getSystemStatus()
  } catch (err) {
    loadError = true
  }

  if (loadError || !status) {
    return <EmptyState title="Koneksi Terputus" description="Gagal memuat status sistem dari server." />
  }

  const { health, diagnostics, runtime } = status

  return (
    <div className="space-y-8">
      
      {/* Header Action */}
      <SectionHeader 
        title="System Health"
        description="Real-time health checks and environment diagnostics"
        actions={<RefreshButton />}
      />

      {/* 1. Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Overall System Status"
          value={health.status}
          subtitle={`${health.checks.length} checks performed`}
          icon={Activity}
          badge={<StatusBadge status={health.status} />}
        />
        <MetricCard
          title="Database Status"
          value={health.checks.find(c => c.name === "database")?.status ?? "UNKNOWN"}
          icon={Database}
        />
        <MetricCard
          title="Environment"
          value={diagnostics.environment}
          subtitle={`Node ${diagnostics.nodeVersion}`}
          icon={Server}
        />
        <MetricCard
          title="Memory Usage"
          value={`${runtime.heapUsedMB} MB`}
          subtitle={`of ${runtime.heapTotalMB} MB allocated`}
          icon={MemoryStick}
        />
      </div>

      {/* 2. Health Check Cards */}
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Diagnostic Checks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {health.checks.map((check) => (
            <HealthCard key={check.name} check={check} />
          ))}
        </div>
      </div>

      {/* 3 & 4. Diagnostics & Runtime Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Diagnostics Summary */}
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Diagnostics Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Build Version"
              value={diagnostics.buildVersion}
              icon={Box}
            />
            <MetricCard
              title="Active Security Modules"
              value={diagnostics.securityModules.length}
              subtitle="Layers active"
              icon={ShieldCheck}
            />
            <MetricCard
              title="Monitoring Subsystems"
              value={diagnostics.monitoringModules.length}
              icon={Activity}
            />
            <MetricCard
              title="Audit Trail Systems"
              value={diagnostics.auditModules.length}
              icon={ShieldCheck}
            />
          </div>
        </div>

        {/* Runtime Snapshot */}
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Runtime Snapshot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Process Uptime"
              value={`${Math.floor(runtime.processUptime / 60)}m ${runtime.processUptime % 60}s`}
              icon={Clock}
            />
            <MetricCard
              title="CPU System Time"
              value={`${(runtime.cpuSystem / 1000000).toFixed(2)}s`}
              icon={Cpu}
            />
            <MetricCard
              title="RSS Memory"
              value={`${runtime.rssMB} MB`}
              subtitle="Resident Set Size"
              icon={MemoryStick}
            />
            <MetricCard
              title="Platform"
              value={runtime.platform}
              subtitle={runtime.arch}
              icon={Server}
            />
          </div>
        </div>

      </div>

    </div>
  )
}
