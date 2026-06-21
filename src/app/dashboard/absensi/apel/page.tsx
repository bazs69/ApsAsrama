import { getApels } from "@/app/actions/absensiApel"
import AbsensiApelClient from "@/components/dashboard/AbsensiApelClient"

export const dynamic = "force-dynamic"

export default async function AbsensiApelPage() {
  const apels = await getApels()

  return <AbsensiApelClient initialApels={apels} />
}
