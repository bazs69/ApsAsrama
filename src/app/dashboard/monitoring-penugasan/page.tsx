import MonitoringPenugasanClient from "@/components/dashboard/MonitoringPenugasanClient"
import MonitoringKepalaSatkerClient from "@/components/dashboard/kepala-satker/MonitoringKepalaSatkerClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSatkerList } from "@/app/actions/laporan"
import prisma from "@/lib/prisma"
import { ComponentProps } from "react"

export const metadata = {
  title: "Monitoring Penugasan | SPThree Connect",
}

export default async function MonitoringPenugasanPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getServerSession(authOptions)
  
  // Show Kepala Satker view if user has satkerId but no global satker.view permission
  if (session?.user?.satkerId && !session?.user?.permissions?.includes("satker.view")) {
    const satkerId = session.user.satkerId
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const satker = await prisma.satker.findUnique({
      where: { id: satkerId },
      include: {
        assignments: {
          include: {
            resident: true,
            monitorings: {
              where: {
                tanggalMonitoring: {
                  gte: new Date(currentYear, currentMonth - 1, 1),
                  lt: new Date(currentYear, currentMonth, 1)
                }
              },
              orderBy: { tanggalMonitoring: 'desc' },
              take: 1
            }
          }
        }
      }
    })

    const laporanBulanan = await prisma.laporanBulananSatker.findUnique({
      where: {
        satkerId_bulan_tahun: {
          satkerId,
          bulan: currentMonth,
          tahun: currentYear
        }
      }
    })

    if (!satker) {
      return <div>Satker tidak ditemukan.</div>
    }

    return (
      <div className="p-6 max-w-full mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
        <MonitoringKepalaSatkerClient 
          satker={satker as unknown as ComponentProps<typeof MonitoringKepalaSatkerClient>["satker"]}
          laporanBulanan={laporanBulanan}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </div>
    )
  }

  const satkerList = await getSatkerList()
  
  const params = await searchParams
  const bulan = params.bulan ? parseInt(params.bulan as string) : new Date().getMonth() + 1
  const tahun = params.tahun ? parseInt(params.tahun as string) : new Date().getFullYear()
  const satkerIdFilter = params.satker as string | undefined
  const statusFilter = params.status as string | undefined

  // Monitoring data
  const where: Record<string, unknown> = {
    tanggalMonitoring: {
      gte: new Date(tahun, bulan - 1, 1),
      lt: new Date(tahun, bulan, 1),
    }
  }
  if (satkerIdFilter) {
    where.assignment = { satkerId: satkerIdFilter }
  }
  if (statusFilter && statusFilter !== "ALL") {
    where.statusMonitoring = statusFilter
  }

  const monitorings = await prisma.monitoringPenugasan.findMany({
    where,
    include: {
      assignment: {
        include: {
          resident: true,
          satker: {
            include: { users: { include: { role: true } } }
          }
        }
      }
    },
    orderBy: { tanggalMonitoring: "desc" }
  })

  // Format monitoring data
  const monitoringData = monitorings.map((m, idx) => ({
    no: idx + 1,
    id: m.id,
    residentId: m.assignment.resident.id,
    name: m.assignment.resident.name,
    nim: m.assignment.resident.nim,
    satker: m.assignment.satker.name,
    kepala: m.assignment.satker.users.find((u: { role?: { name: string } | null, name: string }) => u.role?.name === "KEPALA_SATKER")?.name || "-",
    status: m.statusMonitoring,
    periode: `${new Date(0, bulan - 1).toLocaleString('id-ID', { month: 'long' })} ${tahun}`,
    tanggal: m.tanggalMonitoring.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }))

  // Dashboard Stats
  const totalSantriKIP = await prisma.resident.count({ where: { status: "ACTIVE" } })
  const totalSatker = await prisma.satker.count()
  const totalKepalaSatker = await prisma.user.count({ where: { role: { name: "KEPALA_SATKER" } } })
  
  const laporanBulanIni = await prisma.laporanBulananSatker.count({
    where: { bulan, tahun, status: "SUBMITTED" }
  })
  
  const belumMelapor = totalSatker - laporanBulanIni

  // Rekap Data
  const allSatker = await prisma.satker.findMany({
    include: {
      assignments: { where: { status: "ACTIVE" } },
      laporanBulanan: {
        where: { bulan, tahun, status: "SUBMITTED" }
      }
    }
  })

  const rekapData = allSatker.map((s, idx) => {
    const isLapor = s.laporanBulanan.length > 0
    return {
      no: idx + 1,
      satkerId: s.id,
      satker: s.name,
      jumlah: s.assignments.length,
      sudah: isLapor,
      belum: isLapor ? null : s.assignments.length
    }
  })

  const initialData = {
    bulan,
    tahun,
    satkerIdFilter,
    statusFilter,
    monitoringData,
    dashboardStats: {
      totalSantriKIP,
      totalSatker,
      totalKepalaSatker,
      laporanBulanIni,
      belumMelapor
    },
    rekapData
  }

  return (
    <div className="p-6 max-w-full mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
      <MonitoringPenugasanClient 
        user={(session?.user || null) as unknown as ComponentProps<typeof MonitoringPenugasanClient>["user"]} 
        satkerList={satkerList as unknown as ComponentProps<typeof MonitoringPenugasanClient>["satkerList"]} 
        initialData={initialData as unknown as ComponentProps<typeof MonitoringPenugasanClient>["initialData"]}
      />
    </div>
  )
}
