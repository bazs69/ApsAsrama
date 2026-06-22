import { getResidents } from "@/app/actions/residents"
import { getAreaHierarchy } from "@/app/actions/area"
import { getFakultas, getProdi, getAngkatan } from "@/app/actions/masterData"
import ResidentsClient from "@/components/dashboard/ResidentsClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ResidentsPage() {
  // Jalankan semua query secara paralel, bukan serial
  const [
    residents,
    areaHierarchy,
    fakultasOptions,
    prodiOptions,
    angkatanOptions,
    session
  ] = await Promise.all([
    getResidents(),
    getAreaHierarchy(),
    getFakultas(),
    getProdi(),
    getAngkatan(),
    getServerSession(authOptions)
  ])

  const permissions = session?.user?.permissions || []

  return <ResidentsClient 
    initialResidents={residents} 
    areaHierarchy={areaHierarchy}
    fakultasOptions={fakultasOptions}
    prodiOptions={prodiOptions}
    angkatanOptions={angkatanOptions}
    permissions={permissions}
  />
}
