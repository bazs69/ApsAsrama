import { getMuallims } from "@/app/actions/muallim"
import MuallimClient from "@/components/dashboard/MuallimClient"

export const dynamic = "force-dynamic"

export default async function MuallimPage() {
  const muallims = await getMuallims()

  return <MuallimClient initialMuallims={muallims} />
}
