import { getMuallims } from "@/app/actions/muallim"
import MuallimClient from "@/components/dashboard/MuallimClient"

export const revalidate = 30

export default async function MuallimPage() {
  const muallims = await getMuallims()

  return <MuallimClient initialMuallims={muallims} />
}
