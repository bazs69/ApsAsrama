import { getKegiatans } from "@/app/actions/absensiKegiatan"
import { getKbms } from "@/app/actions/kbm"
import AbsensiKegiatanClient from "@/components/dashboard/AbsensiKegiatanClient"

export const dynamic = "force-dynamic"

export default async function AbsensiKegiatanPage() {
  const kegiatans = await getKegiatans()
  const kbms = await getKbms()

  return <AbsensiKegiatanClient initialKegiatans={kegiatans} kbmOptions={kbms} />
}
