"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { StatusBadge } from "@/components/ops/StatusBadge"
import { ThreatBadge } from "@/components/ops/ThreatBadge"
import type { ThreatLevel } from "@/lib/security/threatDetector"
import { motion } from "@/lib/ui/motion"
import { cn } from "@/lib/utils"

export interface AuditEventRowData {
  id: string
  time: string
  user: string
  module: string
  action: string
  entity: string
  status: "SUCCESS" | "FAILURE"
  severity: ThreatLevel
  
  // Expanded details
  metadata: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

interface AuditRowProps {
  event: AuditEventRowData
}

export function AuditRow({ event }: AuditRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    } else if (e.key === "Escape" && isExpanded) {
      e.preventDefault()
      setIsExpanded(false)
    }
  }

  return (
    <>
      <tr 
        className={cn(
          "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
          motion.fast
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        tabIndex={0}
      >
        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {event.time}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {event.user}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
          {event.module}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
          {event.action}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
          {event.entity}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <StatusBadge status={event.status === "SUCCESS" ? "HEALTHY" : "UNHEALTHY"} />
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <ThreatBadge level={event.severity} />
        </td>
      </tr>
      
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Request Details
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <dt className="text-zinc-500 dark:text-zinc-400">Event ID</dt>
                      <dd className="col-span-2 text-zinc-900 dark:text-zinc-100 font-mono text-xs">{event.id}</dd>
                    </div>
                    {Boolean(event.metadata?.requestId) && (
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-zinc-500 dark:text-zinc-400">Request ID</dt>
                        <dd className="col-span-2 text-zinc-900 dark:text-zinc-100 font-mono text-xs">{String(event.metadata.requestId)}</dd>
                      </div>
                    )}
                    {event.ipAddress && (
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-zinc-500 dark:text-zinc-400">IP Address</dt>
                        <dd className="col-span-2 text-zinc-900 dark:text-zinc-100 font-mono text-xs">{event.ipAddress}</dd>
                      </div>
                    )}
                    {event.userAgent && (
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-zinc-500 dark:text-zinc-400">User Agent</dt>
                        <dd className="col-span-2 text-zinc-900 dark:text-zinc-100 text-xs truncate" title={event.userAgent}>{event.userAgent}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Metadata
                  </h4>
                  <pre className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
