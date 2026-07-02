import DashboardClient from "@/components/dashboard/DashboardClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

// Cache selama 30 detik, refresh otomatis di background (ISR)
export const revalidate = 30

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login")
  }

  // DashboardClient is now a lightweight orchestrator that will route
  // to the appropriate RoleDashboard based on user.role
  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    satkerId: session.user.satkerId,
    permissions: session.user.permissions || []
  }

  return <DashboardClient user={user} />
}
