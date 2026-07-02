import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/Card"

interface MonitoringCardProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  action?: ReactNode
}

export function MonitoringCard({ title, icon: Icon, children, action }: MonitoringCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 flex-row items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 space-y-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col">
        {children}
      </CardContent>
    </Card>
  )
}
