"use client"

import React from "react"
import { RefreshCw, Activity } from "lucide-react"
import { useSystemStatus, getStatusLabel, getStatusStyle } from "../hooks/useSystemStatus"
import { formatTimeAgo } from "@/lib/utils/formatTimeAgo"

export default function SystemStatus() {
  const { status, isLoading, refetch } = useSystemStatus()

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Status sistem aplikasi"
      className="beranda-card animate-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-zinc-500" aria-hidden="true" />
          Status Sistem
        </h2>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 group"
          aria-label="Refresh status"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} aria-hidden="true" />
        </button>
      </div>

      {/* Status List */}
      {isLoading || !status ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3" role="list">
          {[
            { name: "Database", status: status.database },
            { name: "Notifikasi", status: status.notification },
            { name: "Autentikasi", status: status.authentication },
          ].map((item) => {
            const style = getStatusStyle(item.status)
            return (
              <div key={item.name} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 group" role="listitem">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">{item.name}</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${style.text.includes('success') ? 'bg-success-50/50 dark:bg-success-900/10 border-success-500/20' : style.text.includes('warning') ? 'bg-warning-50/50 dark:bg-warning-900/10 border-warning-500/20' : 'bg-danger-50/50 dark:bg-danger-900/10 border-danger-500/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${style.dot.includes('success') ? 'animate-pulse' : ''}`} aria-hidden="true"></span>
                  <span className={`text-[10px] font-extrabold tracking-widest uppercase ${style.text}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              SPThree Connect
            </p>
            {status && (
              <p className="text-[10px] text-zinc-400">
                v{status.appVersion} · Sync {formatTimeAgo(status.lastSync)}
              </p>
            )}
          </div>
          <div className={`w-2 h-2 rounded-full ${status ? getStatusStyle("online").dot : "bg-zinc-300"}`} aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
