import { getAbsensiMuallim } from "@/app/actions/absensiMuallim"
import { getMuallims } from "@/app/actions/muallim"
import AbsensiMuallimClient from "@/components/dashboard/AbsensiMuallimClient"

export const revalidate = 30

export default async function AbsensiMuallimPage() {
  const [absensis, muallims] = await Promise.all([
    getAbsensiMuallim(),
    getMuallims()
  ])

  return <AbsensiMuallimClient initialAbsensi={absensis} muallims={muallims} />
}
