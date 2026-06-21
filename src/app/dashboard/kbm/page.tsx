import MasterDataClient from "@/components/dashboard/MasterDataClient"
import { getKbms, createKbm, updateKbm, deleteKbm } from "@/app/actions/kbm"

export const dynamic = "force-dynamic"

export default async function KbmPage() {
  const kbms = await getKbms()

  return (
    <MasterDataClient
      title="Master Data KBM"
      description="Kelola daftar nama Kegiatan Belajar Mengajar (KBM) atau Kegiatan Asrama lainnya yang akan digunakan pada form Absensi."
      items={kbms}
      createAction={createKbm}
      updateAction={updateKbm}
      deleteAction={deleteKbm}
    />
  )
}
