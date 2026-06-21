import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import LaporanClient from "@/components/dashboard/laporan/LaporanClient"
import { 
  getLaporanDashboardData, 
  getRekapKeaktifanData, 
  getSatkerList, 
  getLaporanMonitoringData, 
  getExportHistory, 
  getLaporanPenugasanData,
  getRiwayatLaporanSatker
} from "@/app/actions/laporan"
import { ComponentProps } from "react"

export default async function LaporanPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/login")
  }
  
  const permissions = session.user.permissions || []
  const hasPerm = (code: string) => permissions.includes(code)

  if (!hasPerm("laporan.view")) {
    redirect("/dashboard")
  }

  const bulan = searchParams.bulan ? parseInt(searchParams.bulan as string) : new Date().getMonth() + 1
  const tahun = searchParams.tahun ? parseInt(searchParams.tahun as string) : new Date().getFullYear()
  const satkerId = searchParams.satker as string | undefined
  const status = searchParams.status as string | undefined
  const tab = (searchParams.tab as string) || "dashboard"

  const satkerList = await getSatkerList()

  // Dashboard data is now global for the top summary cards
  const dashboardData = await getLaporanDashboardData({ bulan, tahun, satkerId })

  let rekapData: Record<string, unknown>[] = []
  let monitoringData: Record<string, unknown>[] = []
  let exportHistoryData: Record<string, unknown>[] = []
  let penugasanData: Record<string, unknown>[] = []
  let riwayatLaporanSatkerData: Record<string, unknown>[] = []

  if (tab === "keaktifan") {
    rekapData = await getRekapKeaktifanData({ bulan, tahun, satkerId }) as Record<string, unknown>[]
  } else if (tab === "monitoring") {
    if (session.user.satkerId && !hasPerm("satker.view")) {
      riwayatLaporanSatkerData = await getRiwayatLaporanSatker() as Record<string, unknown>[]
    } else {
      monitoringData = await getLaporanMonitoringData({ bulan, tahun, satkerId, status }) as Record<string, unknown>[]
    }
  } else if (tab === "export") {
    exportHistoryData = await getExportHistory() as Record<string, unknown>[]
  } else if (tab === "penugasan") {
    penugasanData = await getLaporanPenugasanData({ bulan, tahun, satkerId }) as Record<string, unknown>[]
  }

  return (
    <LaporanClient 
      initialTab={tab}
      bulan={bulan}
      tahun={tahun}
      satkerId={satkerId || ""}
      status={status || "ALL"}
      satkerList={satkerList as unknown as ComponentProps<typeof LaporanClient>["satkerList"]}
      dashboardData={dashboardData as unknown as ComponentProps<typeof LaporanClient>["dashboardData"]}
      rekapData={rekapData as unknown as ComponentProps<typeof LaporanClient>["rekapData"]}
      monitoringData={monitoringData as unknown as ComponentProps<typeof LaporanClient>["monitoringData"]}
      riwayatLaporanSatkerData={riwayatLaporanSatkerData as unknown as ComponentProps<typeof LaporanClient>["riwayatLaporanSatkerData"]}
      exportHistoryData={exportHistoryData as unknown as ComponentProps<typeof LaporanClient>["exportHistoryData"]}
      penugasanData={penugasanData as unknown as ComponentProps<typeof LaporanClient>["penugasanData"]}
      userRole={session.user.role}
    />
  )
}
