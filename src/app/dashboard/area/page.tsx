import { getAreaHierarchy } from "@/app/actions/area"
import AreaClient from "@/components/dashboard/AreaClient"

export const dynamic = "force-dynamic"

export default async function AreaPage() {
  const hierarchy = await getAreaHierarchy()
  
  return (
    <div className="flex flex-col h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Manajemen Area</h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-sm">
          Kelola data Wilayah, Daerah, dan Kamar secara hierarkis.
        </p>
      </div>
      
      <AreaClient initialHierarchy={hierarchy} />
    </div>
  )
}
