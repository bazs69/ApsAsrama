import { getApels } from "@/app/actions/absensiApel"
import AbsensiApelClient from "@/components/dashboard/AbsensiApelClient"

export const revalidate = 30

export default async function AbsensiApelPage() {
  const apels = await getApels()

  return <AbsensiApelClient initialApels={apels} />
}
