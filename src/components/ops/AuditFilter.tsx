"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select } from "@/components/ui/Select"

export function AuditFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "ALL") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("page") // Reset page
    router.push(`${pathname}?${params.toString()}`)
  }

  const status = searchParams.get("status") || "ALL"
  const severity = searchParams.get("severity") || "ALL"
  const moduleFilter = searchParams.get("module") || "ALL"
  const date = searchParams.get("date") || "ALL"
  const sort = searchParams.get("sort") || "newest"

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Filter */}
      <Select
        value={date}
        onChange={(e) => updateFilter("date", e.target.value)}
        className="w-32"
        aria-label="Filter by Date"
      >
        <option value="ALL">All Time</option>
        <option value="TODAY">Today</option>
        <option value="7DAYS">Last 7 Days</option>
        <option value="30DAYS">Last 30 Days</option>
      </Select>

      {/* Status Filter */}
      <Select
        value={status}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="w-32"
        aria-label="Filter by Status"
      >
        <option value="ALL">All Status</option>
        <option value="SUCCESS">Success</option>
        <option value="FAILURE">Failure</option>
      </Select>

      {/* Severity Filter */}
      <Select
        value={severity}
        onChange={(e) => updateFilter("severity", e.target.value)}
        className="w-36"
        aria-label="Filter by Severity"
      >
        <option value="ALL">All Severity</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </Select>

      {/* Module Filter */}
      <Select
        value={moduleFilter}
        onChange={(e) => updateFilter("module", e.target.value)}
        className="w-36"
        aria-label="Filter by Module"
      >
        <option value="ALL">All Modules</option>
        <option value="User">User</option>
        <option value="Role">Role</option>
        <option value="Assignment">Assignment</option>
        <option value="Monitoring">Monitoring</option>
        <option value="Security">Security</option>
        <option value="Health">Health</option>
        <option value="Runtime">Runtime</option>
        <option value="Notification">Notification</option>
      </Select>

      {/* Sort */}
      <Select
        value={sort}
        onChange={(e) => updateFilter("sort", e.target.value)}
        className="w-40"
        aria-label="Sort by"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="severity_desc">Severity (High-Low)</option>
        <option value="severity_asc">Severity (Low-High)</option>
        <option value="module_asc">Module (A-Z)</option>
        <option value="module_desc">Module (Z-A)</option>
      </Select>
    </div>
  )
}
