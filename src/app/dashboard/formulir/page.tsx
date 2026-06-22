import { getAreaHierarchy } from "@/app/actions/area"
import { getFakultas, getProdi, getAngkatan } from "@/app/actions/masterData"
import SantriWizard from "@/components/dashboard/santri/wizard/SantriWizard"

export const revalidate = 30

export default async function FormulirPage() {
  const [areaHierarchy, fakultasOptions, prodiOptions, angkatanOptions] = await Promise.all([
    getAreaHierarchy(),
    getFakultas(),
    getProdi(),
    getAngkatan()
  ])
  
  return <SantriWizard 
    areaHierarchy={areaHierarchy}
    fakultasOptions={fakultasOptions}
    prodiOptions={prodiOptions}
    angkatanOptions={angkatanOptions}
  />
}
