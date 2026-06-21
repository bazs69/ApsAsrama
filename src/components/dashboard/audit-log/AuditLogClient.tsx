"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Shield, Search, Filter, ChevronLeft, ChevronRight,
  Clock, User, Zap, FileText, RefreshCw, X, ChevronDown, ChevronUp
} from "lucide-react"

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  oldValue: unknown
  newValue: unknown
  performedBy: string | null
  createdAt: string | Date
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_RESIDENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  UPDATE_RESIDENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  DELETE_RESIDENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  TRANSFER_ROOM:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  IMPORT_RESIDENTS:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  default:         "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
}

const ENTITY_LABELS: Record<string, string> = {
  RESIDENT: "Santri",
  ROOM: "Kamar",
  USER: "Pengguna",
  ROLE: "Role",
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_RESIDENT:  "Tambah Santri",
  UPDATE_RESIDENT:  "Ubah Santri",
  DELETE_RESIDENT:  "Hapus Santri",
  TRANSFER_ROOM:    "Pindah Kamar",
  IMPORT_RESIDENTS: "Impor Santri",
}

function ChangedFieldsView({ newValue, oldValue }: { newValue: unknown, oldValue: unknown }) {
  const [expanded, setExpanded] = useState(false)
  if (!newValue) return <span className="text-zinc-400 text-xs">—</span>

  let parsedNew: Record<string, unknown> | null = null
  let parsedOld: Record<string, unknown> | null = null

  if (typeof newValue === "string") {
    try { parsedNew = JSON.parse(newValue) } catch { return <span className="text-xs text-zinc-500 font-mono">{newValue as string}</span> }
  } else {
    parsedNew = newValue as Record<string, unknown>
  }

  if (typeof oldValue === "string") {
    try { parsedOld = JSON.parse(oldValue) } catch { parsedOld = null }
  } else {
    parsedOld = oldValue as Record<string, unknown> | null
  }

  const changedFields: string[] = parsedNew?.changedFields as string[] || []
  if (changedFields.length === 0) {
    return <span className="text-zinc-400 text-xs italic">Tidak ada field berubah</span>
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
      >
        {changedFields.length} field berubah
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1.5 max-w-xs">
          {changedFields.map((field: string) => (
            <div key={field} className="text-xs bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 border border-zinc-100 dark:border-zinc-700">
              <span className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">{field}</span>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="line-through text-red-500/80">{String(parsedOld?.[field] ?? "—")}</span>
                <span className="text-emerald-600 dark:text-emerald-400">→ {String(parsedNew?.[field] ?? "—")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Parse the old/new values for UPDATE records
function parseAuditDetail(log: AuditLogEntry) {
  if (log.action !== "UPDATE_RESIDENT") return null
  try {
    const newVal = typeof log.newValue === "string" ? JSON.parse(log.newValue) : log.newValue
    const oldVal = typeof log.oldValue === "string" ? JSON.parse(log.oldValue) : log.oldValue
    return { changedFields: newVal?.changedFields || [], newVal, oldVal }
  } catch { return null }
}

export default function AuditLogClient({
  initialLogs,
  total,
  totalPages,
  currentPage,
  availableActions,
  initialFilters
}: {
  initialLogs: AuditLogEntry[]
  total: number
  totalPages: number
  currentPage: number
  availableActions: string[]
  permissions: string[]
  initialFilters: {
    action: string
    performedBy: string
    dateFrom: string
    dateTo: string
    search: string
  }
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialFilters.search)
  const [filterAction, setFilterAction] = useState(initialFilters.action)
  const [filterUser, setFilterUser] = useState(initialFilters.performedBy)
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom)
  const [dateTo, setDateTo] = useState(initialFilters.dateTo)
  const [showFilters, setShowFilters] = useState(
    !!(initialFilters.action || initialFilters.performedBy || initialFilters.dateFrom || initialFilters.dateTo)
  )

  const applyFilters = useCallback((overrides: Partial<typeof initialFilters & { page: number }> = {}) => {
    const params = new URLSearchParams()
    const s = overrides.search ?? search
    const a = overrides.action ?? filterAction
    const u = overrides.performedBy ?? filterUser
    const df = overrides.dateFrom ?? dateFrom
    const dt = overrides.dateTo ?? dateTo
    const p = overrides.page ?? 1

    if (s) params.set("search", s)
    if (a) params.set("action", a)
    if (u) params.set("user", u)
    if (df) params.set("dateFrom", df)
    if (dt) params.set("dateTo", dt)
    if (p > 1) params.set("page", String(p))

    startTransition(() => {
      router.push(`/dashboard/audit-logs?${params.toString()}`)
    })
  }, [search, filterAction, filterUser, dateFrom, dateTo, router])

  const clearFilters = () => {
    setSearch(""); setFilterAction(""); setFilterUser(""); setDateFrom(""); setDateTo("")
    startTransition(() => router.push("/dashboard/audit-logs"))
  }

  const hasFilters = !!(search || filterAction || filterUser || dateFrom || dateTo)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-500/10 dark:bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Audit Log</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Riwayat seluruh perubahan data dalam sistem • <span className="font-semibold text-violet-600 dark:text-violet-400">{total.toLocaleString()} entri</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyFilters()}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                showFilters
                  ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && applyFilters()}
            placeholder="Cari berdasarkan User, Entity ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 block">Aksi</label>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              >
                <option value="">Semua Aksi</option>
                {availableActions.map(a => (
                  <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 block">User / Email</label>
              <input
                type="text"
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                placeholder="email@..."
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 block">Dari Tanggal</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 block">Sampai Tanggal</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Reset Filter
                </button>
              )}
              <button
                onClick={() => applyFilters()}
                disabled={isPending}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Terapkan Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center p-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-zinc-500 text-sm">Memuat audit log...</p>
            </div>
          </div>
        ) : initialLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Shield className="w-16 h-16 text-zinc-200 dark:text-zinc-700 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Belum Ada Audit Log</h3>
            <p className="text-sm text-zinc-500">
              {hasFilters ? "Tidak ditemukan log yang sesuai dengan filter." : "Sistem belum mencatat perubahan apapun."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                  <tr>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Waktu</div>
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Aksi</div>
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Entitas</div>
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Perubahan
                    </th>
                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Oleh</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {initialLogs.map(log => {
                    const detail = parseAuditDetail(log)
                    const colorClass = ACTION_COLORS[log.action] || ACTION_COLORS.default
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                            {new Date(log.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-zinc-700 dark:text-zinc-300 font-medium">
                            {ENTITY_LABELS[log.entityType] || log.entityType}
                          </div>
                          {log.entityId && (
                            <div className="text-xs text-zinc-400 font-mono mt-0.5 truncate max-w-[140px]" title={log.entityId}>
                              {log.entityId}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 max-w-xs">
                          {detail ? (
                            <ChangedFieldsView newValue={log.newValue} oldValue={log.oldValue} />
                          ) : (
                            <span className="text-xs text-zinc-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(log.performedBy || "S")[0].toUpperCase()}
                            </div>
                            <span className="text-zinc-700 dark:text-zinc-300 text-sm truncate max-w-[140px]" title={log.performedBy || "System"}>
                              {log.performedBy || "System"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-500">
                Halaman <span className="font-semibold text-zinc-800 dark:text-zinc-200">{currentPage}</span> dari <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalPages}</span>
                <span className="ml-2 text-zinc-400">({total.toLocaleString()} total entri)</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyFilters({ page: currentPage - 1 })}
                  disabled={currentPage <= 1 || isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <button
                  onClick={() => applyFilters({ page: currentPage + 1 })}
                  disabled={currentPage >= totalPages || isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
