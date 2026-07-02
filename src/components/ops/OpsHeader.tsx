import { ShieldAlert } from "lucide-react"

export function OpsHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 px-8 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Operational Center
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enterprise Monitoring, Security, Health & Diagnostics
        </p>
      </div>
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-full border border-success-200 dark:border-success-800">
        <ShieldAlert className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Production Ready
        </span>
      </div>
    </div>
  )
}
