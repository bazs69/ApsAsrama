import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Sidebar from "@/components/dashboard/Sidebar"
import MobileSidebar from "@/components/dashboard/MobileSidebar"
import Topbar from "@/components/dashboard/Topbar"
import IdleTimeoutProvider from "@/components/providers/IdleTimeoutProvider"
import { SidebarProvider } from "@/components/providers/SidebarProvider"
import CommandPalette from "@/components/CommandPalette"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <IdleTimeoutProvider>
      <SidebarProvider>
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 overflow-hidden transition-colors duration-300">

          {/* Mobile Sidebar */}
          <MobileSidebar userRole={session.user.role} permissions={session.user.permissions} />

          {/* Sidebar - Desktop */}
          <div className="hidden md:flex w-64 flex-col glass border-r border-zinc-200 dark:border-zinc-800 z-10 transition-colors duration-300">
            <Sidebar userRole={session.user.role} permissions={session.user.permissions} />
          </div>

          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Topbar */}
            <Topbar user={session.user} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.05),rgba(255,255,255,0))] dark:bg-transparent">
              {children}
            </main>
          </div>
        </div>
        <CommandPalette userRole={session.user.role} />
      </SidebarProvider>
    </IdleTimeoutProvider>
  )
}
