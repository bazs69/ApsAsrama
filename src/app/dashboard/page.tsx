import prisma from "@/lib/prisma"
import { RoomStatus, ResidentStatus } from "@prisma/client"
import DashboardClient from "@/components/dashboard/DashboardClient"
import DashboardKepalaSatkerClient from "@/components/dashboard/kepala-satker/DashboardKepalaSatkerClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Cache selama 30 detik, refresh otomatis di background (ISR)
export const revalidate = 30

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Show Kepala Satker-specific view if user has a satkerId and lacks satker.view (global overview)
  if (session?.user?.satkerId && !session.user.permissions?.includes("satker.view")) {
    const satkerId = session.user.satkerId
    
    const satker = await prisma.satker.findUnique({
      where: { id: satkerId },
      include: {
        assignments: {
          include: {
            monitorings: {
              orderBy: { tanggalMonitoring: 'desc' }
            }
          }
        }
      }
    })

    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    const laporanBulanan = await prisma.laporanBulananSatker.findUnique({
      where: {
        satkerId_bulan_tahun: {
          satkerId,
          bulan: currentMonth,
          tahun: currentYear
        }
      }
    })

    const statusLaporan = laporanBulanan ? laporanBulanan.status : "BELUM_LAPOR"

    let sangatAktif = 0
    let aktif = 0
    let cukupAktif = 0
    let kurangAktif = 0

    if (satker) {
      satker.assignments.forEach(assignment => {
        const thisMonthMonitorings = assignment.monitorings.filter(m => {
          const mDate = new Date(m.tanggalMonitoring)
          return mDate.getMonth() + 1 === currentMonth && mDate.getFullYear() === currentYear
        })

        if (thisMonthMonitorings.length > 0) {
          const latestStatus = thisMonthMonitorings[0].statusMonitoring
          if (latestStatus === "Sangat Aktif") sangatAktif++
          else if (latestStatus === "Aktif") aktif++
          else if (latestStatus === "Cukup Aktif") cukupAktif++
          else if (latestStatus === "Kurang Aktif") kurangAktif++
        }
      })
    }

    const satkerStats = {
      namaSatker: satker?.name || "-",
      totalAnggota: satker?.assignments.length || 0,
      sangatAktif,
      aktif,
      cukupAktif,
      kurangAktif,
      statusLaporan: statusLaporan as "SUBMITTED" | "DRAFT" | "BELUM_LAPOR"
    }

    return <DashboardKepalaSatkerClient stats={satkerStats} />
  }

  // Fetch rooms with residents
  const rooms = await prisma.room.findMany({
    include: {
      residents: {
        where: { status: ResidentStatus.ACTIVE }
      }
    }
  })

  // Fetch recent active santri registrations
  const recentRegistrations = await prisma.resident.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { room: true }
  })

  // Calculate metrics in-memory (very fast and single query to rooms)
  const totalRoomsCount = rooms.length
  const availableRoomsCount = rooms.filter(r => r.status === RoomStatus.AVAILABLE).length
  const occupiedRoomsCount = rooms.filter(r => r.status === RoomStatus.OCCUPIED).length
  const maintenanceRoomsCount = rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length

  // Beds capacity metrics
  const totalBeds = rooms.reduce((acc, r) => acc + r.capacity, 0)
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.residents.length, 0)
  const availableBeds = totalBeds - occupiedBeds

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  // Count total active santri
  const totalActiveSantri = await prisma.resident.count({
    where: { status: ResidentStatus.ACTIVE }
  })

  const roomStats = rooms.sort((a, b) => a.number.localeCompare(b.number)).map(room => ({
    roomNumber: room.number,
    beds: room.capacity,
    occupied: room.residents.length,
    rate: room.capacity > 0 ? Math.round((room.residents.length / room.capacity) * 100) : 0
  }))

  const dashboardStats = {
    totalSantri: totalActiveSantri,
    availableRooms: availableRoomsCount,
    occupiedRooms: occupiedRoomsCount,
    maintenanceRooms: maintenanceRoomsCount,
    totalRooms: totalRoomsCount,
    occupancyRate,
    totalBeds,
    occupiedBeds,
    availableBeds,
    roomStats,
    recentActivities: recentRegistrations.map(reg => ({
      id: reg.id,
      name: reg.name,
      roomNumber: reg.room ? reg.room.number : null,
      createdAt: reg.createdAt.toISOString()
    }))
  }

  return <DashboardClient stats={dashboardStats} />
}
