import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import SettingsClient from "@/components/dashboard/SettingsClient"
import { getUsers } from "@/app/actions/settings"
import { getSatkerList } from "@/app/actions/laporan"
import { getRoles } from "@/app/actions/roles"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pengaturan | Sistem Asrama",
  description: "Pengaturan akun dan manajemen pengguna",
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect("/login")
  }

  const hasPerm = (action: string) => session.user.permissions?.includes(action)
  if (!hasPerm("pengaturan.view")) {
    redirect("/dashboard/forbidden")
  }

  const users = await getUsers()
  const satkerList = hasPerm("satker.view") || hasPerm("pengaturan.view") ? await getSatkerList() : []
  const roles = hasPerm("role.view") || hasPerm("pengaturan.view") ? await getRoles() : []

  return (
    <SettingsClient
      currentUser={session.user}
      initialUsers={users}
      satkerList={satkerList}
      availableRoles={roles}
    />
  )
}

