import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { quickAccessByRole } from "../data/quickAccessConfig"

interface QuickAccessProps {
  role: string;
}

export default function QuickAccess({ role }: QuickAccessProps) {
  const normalizedRole = role.toUpperCase()
  // Admin is often used instead of SUPER_ADMIN
  const accessRole = normalizedRole === "ADMIN" ? "SUPER_ADMIN" : normalizedRole
  const links = quickAccessByRole[accessRole] || []

  if (links.length === 0) return null

  return (
    <div className="beranda-card animate-in slide-in-from-bottom-2 duration-300">
      <div>
        <h2 className="text-base font-bold text-[#032e15] dark:text-zinc-100 mb-5">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3" role="navigation" aria-label="Jalan pintas aksi cepat">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.id}
                href={link.href}
                className="group relative bg-white dark:bg-primary-900/20 hover:bg-zinc-50 dark:hover:bg-primary-900/40 border border-zinc-200 dark:border-primary-800/30 rounded-2xl p-4 transition-all duration-300 text-left flex flex-col hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 overflow-hidden"
              >
                {/* Decorative background circle on hover */}
                <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-500 scale-50 group-hover:scale-150 ${link.colorClass.split(' ')[2] || 'bg-zinc-500/10'}`}></div>

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-transform duration-200 group-hover:scale-110 ${link.colorClass}`} aria-hidden="true">
                    <Icon className="w-5 h-5" />
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-all duration-200 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                </div>

                <div className="relative z-10 mt-auto">
                  <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-sm leading-tight mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{link.label}</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">Akses cepat menu</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
