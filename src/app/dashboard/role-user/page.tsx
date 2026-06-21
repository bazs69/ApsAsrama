import { getRoles, getPermissions } from "@/app/actions/roles"
import RoleUserClient from "@/components/dashboard/role-user/RoleUserClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Manajemen Role User",
}

export default async function RoleUserPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  
  // Super admin bypass or check permission
  if (session.user.role !== "SUPER_ADMIN" && !session.user.permissions.includes("Role.View")) {
    redirect("/dashboard/forbidden")
  }

  const [roles, permissions] = await Promise.all([
    getRoles(),
    getPermissions()
  ])

  return <RoleUserClient initialRoles={roles} allPermissions={permissions} />
}
