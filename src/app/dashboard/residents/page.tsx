import { getResidents } from "@/app/actions/residents"
import { getAreaHierarchy } from "@/app/actions/area"
import { getFakultas, getProdi, getAngkatan } from "@/app/actions/masterData"
import ResidentsClient from "@/components/dashboard/ResidentsClient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function ResidentsPage() {
  const residents = await getResidents()
  const areaHierarchy = await getAreaHierarchy()
  const fakultasOptions = await getFakultas()
  const prodiOptions = await getProdi()
  const angkatanOptions = await getAngkatan()
  const session = await getServerSession(authOptions)
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
