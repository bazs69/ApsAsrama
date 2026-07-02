import { OpsHeader } from "@/components/ops/OpsHeader"
import { OpsTabs } from "@/components/ops/OpsTabs"

export const metadata = {
  title: "Operational Center | SPThree Connect",
  description: "Enterprise Monitoring, Security, Health & Diagnostics",
}

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/50">
      <OpsHeader />
      <OpsTabs />
      <div className="flex-1 overflow-auto">
        <main className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
