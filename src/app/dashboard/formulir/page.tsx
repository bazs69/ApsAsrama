import { getAreaHierarchy } from "@/app/actions/area"
import { getFakultas, getProdi, getAngkatan } from "@/app/actions/masterData"
import SantriWizard from "@/components/dashboard/santri/wizard/SantriWizard"

export const dynamic = "force-dynamic"

export default async function FormulirPage() {
  const areaHierarchy = await getAreaHierarchy()
  const fakultasOptions = await getFakultas()
  const prodiOptions = await getProdi()
  const angkatanOptions = await getAngkatan()
  
  return <SantriWizard 
    areaHierarchy={areaHierarchy}
    fakultasOptions={fakultasOptions}
    prodiOptions={prodiOptions}
    angkatanOptions={angkatanOptions}
  />
}
