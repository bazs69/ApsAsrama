import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PriorityAction } from "../types"

interface PriorityCardProps {
  action: PriorityAction
}

export function getPriorityStyle(severity: PriorityAction["severity"]) {
  const config = {
    success: {
      bg: "bg-success-50 dark:bg-success-900/10",
      border: "border-success-500/20",
      text: "text-success-700 dark:text-success-400",
      iconBg: "bg-success-500/10",
      iconColor: "text-success-600 dark:text-success-400"
    },
    info: {
      bg: "bg-info-50 dark:bg-info-900/10",
      border: "border-info-500/20",
      text: "text-info-700 dark:text-info-400",
      iconBg: "bg-info-500/10",
      iconColor: "text-info-600 dark:text-info-400"
    },
    warning: {
      bg: "bg-warning-50 dark:bg-warning-900/10",
      border: "border-warning-500/20",
      text: "text-warning-700 dark:text-warning-400",
      iconBg: "bg-warning-500/10",
      iconColor: "text-warning-600 dark:text-warning-400"
    },
    danger: {
      bg: "bg-danger-50 dark:bg-danger-900/10",
      border: "border-danger-500/20",
      text: "text-danger-700 dark:text-danger-400",
      iconBg: "bg-danger-500/10",
      iconColor: "text-danger-600 dark:text-danger-400"
    },
    primary: {
      bg: "bg-primary-50 dark:bg-primary-900/10",
      border: "border-primary-500/20",
      text: "text-primary-700 dark:text-primary-400",
      iconBg: "bg-primary-500/10",
      iconColor: "text-primary-600 dark:text-primary-400"
    }
  }
  return config[severity] || config.primary
}

export default function PriorityCard({ action }: PriorityCardProps) {
  const style = getPriorityStyle(action.severity)
  const Icon = action.icon

  return (
    <div 
      className={`relative overflow-hidden rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-xl duration-200 bg-white dark:bg-zinc-900/60 shadow-md border-zinc-200/80 dark:border-zinc-800/80 group`}
      tabIndex={0}
      aria-label={`Tugas Prioritas: ${action.title}`}
    >
      {/* Left Accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.bg.replace('bg-', 'bg-').split(' ')[0]} opacity-70 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex flex-col h-full pl-2">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg} ring-4 ring-white dark:ring-zinc-950 shadow-sm transition-transform duration-200 group-hover:scale-110`} aria-hidden="true">
            {Icon && <Icon className={`w-6 h-6 ${style.iconColor}`} />}
          </div>
          {action.badge && (
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest ${style.iconBg} ${style.iconColor} border border-current/10 shadow-sm`}>
              {action.badge}
            </span>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-extrabold text-lg mb-1.5 text-zinc-900 dark:text-white group-hover:${style.text.split(' ')[0]} transition-colors`}>{action.title}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2 leading-relaxed">{action.description}</p>
          
          {(action.count !== undefined || action.dueAt) && (
            <div className="flex items-center gap-4 mb-5 p-3.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/50">
              {action.count !== undefined && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Total</span>
                  <span className={`text-3xl font-black leading-none tracking-tight ${style.text}`}>{action.count}</span>
                </div>
              )}
              {action.count !== undefined && action.dueAt && (
                <div className="w-px h-10 bg-zinc-200 dark:bg-zinc-800"></div>
              )}
              {action.dueAt && (
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-0.5">Deadline</span>
                  <span className={`text-sm font-bold ${style.text} ${action.isCritical ? 'animate-pulse text-danger-600 dark:text-danger-400' : ''}`}>
                    {new Date(action.dueAt).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {action.actionHref && (
          <div className="mt-auto pt-2">
            <Link 
              href={action.actionHref}
              className={`inline-flex items-center justify-center w-full gap-2 py-2.5 px-4 text-sm font-bold transition-all hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-xl ${style.bg} ${style.text} border border-current/10 group-hover:shadow-sm`}
              aria-label={`Tindak lanjuti ${action.title}`}
            >
              {action.actionLabel || "Tindak Lanjuti"}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
