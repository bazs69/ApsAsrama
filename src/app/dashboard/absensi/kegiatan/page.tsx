import { getKegiatans } from "@/app/actions/absensiKegiatan"
import { getKbms } from "@/app/actions/kbm"
import AbsensiKegiatanClient from "@/components/dashboard/AbsensiKegiatanClient"

export const revalidate = 30

export default async function AbsensiKegiatanPage() {
  const [kegiatans, kbms] = await Promise.all([
    getKegiatans(),
    getKbms()
  ])

  return <AbsensiKegiatanClient initialKegiatans={kegiatans} kbmOptions={kbms} />
}
