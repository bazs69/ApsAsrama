import { Info, Server, Layers, Settings, Globe, Clock, Terminal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"

interface RuntimeInfoProps {
  nodeVersion: string
  platform: string
  arch: string
  pid: number
  environment: string
  timezone: string
  bootTime: string
}

export function RuntimeInfoCard({ info }: { info: RuntimeInfoProps }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-50 dark:bg-slate-900/20 rounded-lg text-slate-600 dark:text-slate-400">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">System Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <InfoItem icon={<Terminal className="w-4 h-4" />} label="Node Version" value={info.nodeVersion} />
          <InfoItem icon={<Server className="w-4 h-4" />} label="Platform" value={info.platform} />
          <InfoItem icon={<Layers className="w-4 h-4" />} label="Architecture" value={info.arch} />
          <InfoItem icon={<Settings className="w-4 h-4" />} label="Process ID (PID)" value={info.pid.toString()} />
          <InfoItem icon={<Globe className="w-4 h-4" />} label="Environment" value={info.environment} />
          <InfoItem icon={<Clock className="w-4 h-4" />} label="Timezone" value={info.timezone} />
          <InfoItem icon={<Clock className="w-4 h-4" />} label="Boot Time" value={info.bootTime} />
        </div>
      </CardContent>
    </Card>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  )
}
