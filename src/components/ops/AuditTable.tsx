import { AuditRow, type AuditEventRowData } from "./AuditRow"
import EmptyState from "@/components/ui/EmptyState"
import { Database } from "lucide-react"

interface AuditTableProps {
  events: AuditEventRowData[]
}

export function AuditTable({ events }: AuditTableProps) {
  if (events.length === 0) {
    return (
      <EmptyState 
        variant="search"
        title="Tidak Ada Riwayat Audit" 
        description="Tidak ditemukan log security event yang cocok dengan filter atau kata kunci pencarian Anda."
        icon={Database}
      />
    )
  }

  return (
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-x-auto bg-white dark:bg-zinc-900 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Actor
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Module
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Action
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Entity
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Severity
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <AuditRow key={event.id} event={event} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
