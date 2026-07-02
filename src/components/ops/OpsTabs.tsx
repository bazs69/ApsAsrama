"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "@/lib/ui/motion"

const tabs = [
  { href: "/dashboard/ops", label: "Overview" },
  { href: "/dashboard/ops/health", label: "Health" },
  { href: "/dashboard/ops/monitoring", label: "Monitoring" },
  { href: "/dashboard/ops/security", label: "Security" },
  { href: "/dashboard/ops/audit", label: "Audit" },
  { href: "/dashboard/ops/runtime", label: "Runtime" },
  { href: "/dashboard/ops/notifications", label: "Notifications" },
]

export function OpsTabs() {
  const pathname = usePathname()

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="px-8">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${motion.normal}
                  ${
                    isActive
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/10"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Tab ${tab.label}`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
