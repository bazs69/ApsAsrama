import { getSatkers } from "@/app/actions/assignments"
import SatkerListClient from "@/components/dashboard/SatkerListClient"

export const revalidate = 30

export default async function SatkersPage() {
  const satkers = await getSatkers()

  return <SatkerListClient initialSatkers={satkers} />
}
