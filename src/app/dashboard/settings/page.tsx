import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PERMISSIONS } from "@/lib/security/permissions"
import SettingsClient from "@/components/dashboard/SettingsClient"
import { getUsers } from "@/app/actions/settings"
import { getSatkerList } from "@/app/actions/laporan"
import { getRoles } from "@/app/actions/roles"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pengaturan | Sistem Asrama",
  description: "Pengaturan akun dan manajemen pengguna",
}

interface SettingsPageProps {
  searchParams: Promise<{
    page?: string
    pageSize?: string
    search?: string
    sort?: string
    order?: string
  }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  const hasPerm = (action: string) => session.user.permissions?.includes(action)
  if (!hasPerm(PERMISSIONS.PENGATURAN_VIEW)) {
    redirect("/dashboard/forbidden")
  }

  // Read all table params from URL — ensures server pre-renders the correct state.
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = [10, 20, 50].includes(Number(params.pageSize ?? 10))
    ? Number(params.pageSize ?? 10)
    : 10
  const search = params.search ?? ""
  const sort = (["name", "email", "createdAt"].includes(params.sort ?? "")
    ? params.sort
    : "createdAt") as "name" | "email" | "createdAt"
  const order = (["asc", "desc"].includes(params.order ?? "") ? params.order : "asc") as "asc" | "desc"

  const [usersRes, satkerList, roles] = await Promise.all([
    getUsers(page, pageSize, search, sort, order),
    hasPerm(PERMISSIONS.SATKER_VIEW) || hasPerm(PERMISSIONS.PENGATURAN_VIEW)
      ? getSatkerList()
      : Promise.resolve([]),
    hasPerm(PERMISSIONS.ROLE_VIEW) || hasPerm(PERMISSIONS.PENGATURAN_VIEW)
      ? getRoles()
      : Promise.resolve([]),
  ])

  return (
    <SettingsClient
      currentUser={session.user}
      initialUsers={usersRes.data}
      initialPagination={usersRes.metadata}
      satkerList={satkerList}
      availableRoles={roles}
    />
  )
}
