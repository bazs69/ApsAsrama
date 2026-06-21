"use server"

import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

const KEAKTIFAN_SCORE = {
  "Sangat Aktif": 4,
  "Aktif": 3,
  "Cukup Aktif": 2,
  "Kurang Aktif": 1,
}

function getScore(status: string) {
  return KEAKTIFAN_SCORE[status as keyof typeof KEAKTIFAN_SCORE] || 0
}

export async function getLaporanDashboardData(filters: { bulan?: number, tahun?: number, satkerId?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("dashboard.view")) return null

    if (!session.user.permissions?.includes("satker.view") && session.user.satkerId) {
      filters.satkerId = session.user.satkerId
    }

    const whereAssignment: Prisma.AssignmentWhereInput = { status: "ACTIVE" }
    if (filters.satkerId) {
      whereAssignment.satkerId = filters.satkerId
    }

    const totalSantriDitugaskan = (await prisma.assignment.groupBy({
      by: ['residentId'],
      where: whereAssignment
    })).length

    const totalSatkerAktif = filters.satkerId ? 1 : (await prisma.assignment.groupBy({
      by: ['satkerId'],
      where: { status: "ACTIVE" }
    })).length

    const now = new Date()
    const targetBulan = filters.bulan || now.getMonth() + 1
    const targetTahun = filters.tahun || now.getFullYear()

    const monitoringWhere: Prisma.MonitoringPenugasanWhereInput = {
      tanggalMonitoring: {
        gte: new Date(targetTahun, targetBulan - 1, 1),
        lt: new Date(targetTahun, targetBulan, 1),
      }
    }
    if (filters.satkerId) {
      monitoringWhere.assignment = { satkerId: filters.satkerId }
    }

    const totalMonitoringBulanIni = await prisma.monitoringPenugasan.count({
      where: monitoringWhere
    })

    // Keaktifan Keseluruhan
    const allMonitoring = await prisma.monitoringPenugasan.findMany({
      where: monitoringWhere,
      select: { statusMonitoring: true }
    })

    let totalScore = 0
    let validCount = 0
    allMonitoring.forEach(m => {
      const score = getScore(m.statusMonitoring)
      if (score > 0) {
        totalScore += score
        validCount++
      }
    })

    // max score per monitoring is 4.
    const averageKeaktifan = validCount > 0 ? (totalScore / (validCount * 4)) * 100 : 0

    // Grafik Trend Monitoring (6 bulan terakhir)
    const trendData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(targetTahun, targetBulan - 1 - i, 1)
      const nextD = new Date(targetTahun, targetBulan - i, 1)
      const count = await prisma.monitoringPenugasan.count({
        where: {
          tanggalMonitoring: { gte: d, lt: nextD },
          ...(filters.satkerId && { assignment: { satkerId: filters.satkerId } })
        }
      })
      trendData.push({
        name: d.toLocaleString('id-ID', { month: 'short' }),
        jumlah: count
      })
    }

    // Grafik Distribusi
    const distribusi = { "Sangat Aktif": 0, "Aktif": 0, "Cukup Aktif": 0, "Kurang Aktif": 0 }
    allMonitoring.forEach(m => {
      if (distribusi[m.statusMonitoring as keyof typeof distribusi] !== undefined) {
        distribusi[m.statusMonitoring as keyof typeof distribusi]++
      }
    })

    const distribusiData = Object.entries(distribusi).map(([name, value]) => ({ name, value }))

    return {
      totalSantriDitugaskan,
      totalSatkerAktif,
      totalMonitoringBulanIni,
      tingkatKeaktifan: averageKeaktifan.toFixed(1),
      trendData,
      distribusiData
    }
  } catch (error) {
    console.error("Dashboard error:", error)
    return null
  }
}

export async function getRekapKeaktifanData(filters: { bulan?: number, tahun?: number, satkerId?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("dashboard.view")) return []

    if (!session.user.permissions?.includes("satker.view") && session.user.satkerId) {
      filters.satkerId = session.user.satkerId
    }

    const whereAssignment: Prisma.AssignmentWhereInput = { status: "ACTIVE" }
    if (filters.satkerId) {
      whereAssignment.satkerId = filters.satkerId
    }

    const targetBulan = filters.bulan
    const targetTahun = filters.tahun

    const monitoringFilter: Prisma.MonitoringPenugasanWhereInput = {}
    if (targetBulan && targetTahun) {
      monitoringFilter.tanggalMonitoring = {
        gte: new Date(targetTahun, targetBulan - 1, 1),
        lt: new Date(targetTahun, targetBulan, 1),
      }
    }

    const assignments = await prisma.assignment.findMany({
      where: whereAssignment,
      include: {
        resident: true,
        satker: true,
        monitorings: {
          where: monitoringFilter
        }
      }
    })

    const results = assignments.map(a => {
      let totalScore = 0
      let validCount = 0
      a.monitorings.forEach(m => {
        const score = getScore(m.statusMonitoring)
        if (score > 0) {
          totalScore += score
          validCount++
        }
      })
      const averageScore = validCount > 0 ? (totalScore / validCount) : 0
      let statusLabel = "-"
      if (averageScore >= 3.5) statusLabel = "Sangat Aktif"
      else if (averageScore >= 2.5) statusLabel = "Aktif"
      else if (averageScore >= 1.5) statusLabel = "Cukup Aktif"
      else if (averageScore > 0) statusLabel = "Kurang Aktif"

      return {
        id: a.resident.id,
        namaSantri: a.resident.name,
        nim: a.resident.nim,
        satker: a.satker.name,
        rataRata: averageScore.toFixed(2),
        score: averageScore,
        status: statusLabel,
        totalMonitoring: validCount
      }
    })

    // Only return ones with monitoring data or all? Let's return all, score 0 means Belum dinilai
    // Sort by score descending
    return results.sort((a, b) => b.score - a.score)

  } catch (error) {
    console.error("Rekap error:", error)
    return []
  }
}

export async function logExportAction(fileName: string, reportType: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("laporan.export")) return { error: "Unauthorized" }

    await prisma.exportHistory.create({
      data: {
        fileName,
        reportType,
        userId: session.user.id
      }
    })
    revalidatePath("/dashboard/laporan")
    return { success: true }
  } catch (error) {
    console.error("Log export error:", error)
    return { error: "Failed" }
  }
}

export async function getExportHistory() {
  try {
    return await prisma.exportHistory.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } }
    })
  } catch {
    return []
  }
}

export async function getSatkerList() {
  try {
    return await prisma.satker.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
  } catch {
    return []
  }
}

export async function getLaporanMonitoringData(filters: { bulan?: number, tahun?: number, satkerId?: string, status?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("monitoring.view")) return []

    if (!session.user.permissions?.includes("satker.view") && session.user.satkerId) {
      filters.satkerId = session.user.satkerId
    }

    const where: Prisma.MonitoringPenugasanWhereInput = {}
    
    if (filters.bulan && filters.tahun) {
      where.tanggalMonitoring = {
        gte: new Date(filters.tahun, filters.bulan - 1, 1),
        lt: new Date(filters.tahun, filters.bulan, 1),
      }
    }
    
    if (filters.status && filters.status !== "ALL") {
      where.statusMonitoring = filters.status
    }
    
    if (filters.satkerId) {
      where.assignment = { satkerId: filters.satkerId }
    }

    const monitorings = await prisma.monitoringPenugasan.findMany({
      where,
      include: {
        assignment: {
          include: {
            resident: true,
            satker: true
          }
        }
      },
      orderBy: { tanggalMonitoring: "desc" }
    })

    return monitorings.map(m => ({
      id: m.id,
      residentId: m.assignment.resident.id,
      namaSantri: m.assignment.resident.name,
      nim: m.assignment.resident.nim,
      satker: m.assignment.satker.name,
      status: m.statusMonitoring,
      catatan: m.catatanMonitoring || "-",
      tanggal: m.tanggalMonitoring
    }))
  } catch (error) {
    console.error("Laporan monitoring error:", error)
    return []
  }
}

export async function getLaporanPenugasanData(filters: { bulan?: number, tahun?: number, satkerId?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("penugasan.view")) return []

    if (!session.user.permissions?.includes("satker.view") && session.user.satkerId) {
      filters.satkerId = session.user.satkerId
    }

    const where: Prisma.AssignmentWhereInput = {}
    if (filters.satkerId) {
      where.satkerId = filters.satkerId
    }

    // if filters.bulan & tahun are used for penugasan? Penugasan is usually continuous.
    // If they want to filter by start date in that month, we can add it, but normally it's just all active assignments or assignments starting in that month.
    // Let's filter assignments that were active during that month (startDate <= endOfMonth and (endDate >= startOfMonth or endDate is null))
    if (filters.bulan && filters.tahun) {
      const startOfMonth = new Date(filters.tahun, filters.bulan - 1, 1)
      const endOfMonth = new Date(filters.tahun, filters.bulan, 0, 23, 59, 59)
      
      where.startDate = { lte: endOfMonth }
      where.OR = [
        { endDate: null },
        { endDate: { gte: startOfMonth } }
      ]
    }

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        resident: true,
        satker: true
      },
      orderBy: { startDate: "desc" }
    })

    return assignments.map(a => ({
      id: a.id,
      residentId: a.resident.id,
      namaSantri: a.resident.name,
      nim: a.resident.nim,
      satker: a.satker.name,
      tanggalMulai: a.startDate,
      status: a.status
    }))
  } catch (error) {
    console.error("Laporan penugasan error:", error)
    return []
  }
}

export async function deleteExportHistory(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("laporan.export")) {
      return { error: "Unauthorized" }
    }

    await prisma.exportHistory.delete({ where: { id } })
    revalidatePath("/dashboard/laporan")
    return { success: true }
  } catch (error) {
    console.error("Delete export history error:", error)
    return { error: "Gagal menghapus riwayat export." }
  }
}

export async function getSantriDetailForLaporan(residentId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("santri.view")) return null

    const resident = await prisma.resident.findUnique({
      where: { id: residentId },
      include: {
        assignments: {
          include: {
            satker: true
          },
          orderBy: { startDate: "desc" }
        }
      }
    })

    if (!resident) return null

    const allMonitorings = await prisma.monitoringPenugasan.findMany({
      where: {
        assignment: {
          residentId: residentId
        }
      },
      include: {
        assignment: {
          include: {
            satker: true
          }
        }
      },
      orderBy: { tanggalMonitoring: "desc" }
    })

    return {
      profil: {
        nama: resident.name,
        nim: resident.nim,
        asrama: resident.daerah || resident.wilayah || "-",
        prodi: resident.prodi || "-",
        status: resident.status
      },
      penugasan: resident.assignments.map(a => ({
        id: a.id,
        satker: a.satker.name,
        posisi: a.position,
        tanggalMulai: a.startDate,
        tanggalSelesai: a.endDate,
        status: a.status
      })),
      monitoring: allMonitorings.map(m => ({
        id: m.id,
        tanggal: m.tanggalMonitoring,
        satker: m.assignment.satker.name,
        status: m.statusMonitoring,
        catatan: m.catatanMonitoring
      }))
    }
  } catch (error) {
    console.error("Get detail santri error:", error)
    return null
  }
}

export type SaveMonitoringSatkerInput = {
  satkerId: string
  bulan: number
  tahun: number
  kesimpulan: string
  statusLaporan: "DRAFT" | "SUBMITTED"
  monitorings: {
    assignmentId: string
    status: string
    catatan: string
  }[]
}

export async function saveMonitoringSatker(input: SaveMonitoringSatkerInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("monitoring.create")) {
      return { success: false, error: "Unauthorized" }
    }

    if (session.user.satkerId !== input.satkerId) {
      return { success: false, error: "Forbidden: You can only update your own satker." }
    }

    const { satkerId, bulan, tahun, kesimpulan, statusLaporan, monitorings } = input

    // 1. Upsert LaporanBulananSatker
    await prisma.laporanBulananSatker.upsert({
      where: {
        satkerId_bulan_tahun: {
          satkerId,
          bulan,
          tahun
        }
      },
      update: {
        kesimpulan,
        status: statusLaporan
      },
      create: {
        satkerId,
        bulan,
        tahun,
        kesimpulan,
        status: statusLaporan
      }
    })

    // 2. Upsert MonitoringPenugasan for each assignment
    const targetDate = new Date(tahun, bulan - 1, 15) // Use middle of the month for the monitoring date
    
    // Process each monitoring sequentially to avoid complex raw upserts or transaction issues with prisma
    for (const m of monitorings) {
      // Find if there's already a monitoring for this assignment in this month/year
      const existingMonitoring = await prisma.monitoringPenugasan.findFirst({
        where: {
          assignmentId: m.assignmentId,
          tanggalMonitoring: {
            gte: new Date(tahun, bulan - 1, 1),
            lt: new Date(tahun, bulan, 1)
          }
        }
      })

      if (existingMonitoring) {
        await prisma.monitoringPenugasan.update({
          where: { id: existingMonitoring.id },
          data: {
            statusMonitoring: m.status,
            catatanMonitoring: m.catatan,
            updatedAt: new Date()
          }
        })
      } else {
        await prisma.monitoringPenugasan.create({
          data: {
            assignmentId: m.assignmentId,
            tanggalMonitoring: targetDate,
            statusMonitoring: m.status,
            catatanMonitoring: m.catatan,
            createdBy: session.user.id
          }
        })
      }
    }

    revalidatePath("/dashboard/monitoring-penugasan")
    revalidatePath("/dashboard/laporan")
    revalidatePath("/dashboard")
    
    return { success: true }
  } catch (error) {
    console.error("Save monitoring satker error:", error)
    return { success: false, error: "Failed to save data" }
  }
}

export async function getRiwayatLaporanSatker() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("laporan.view")) return []

    const satkerId = session.user.satkerId
    if (!satkerId) return []

    const riwayat = await prisma.laporanBulananSatker.findMany({
      where: { satkerId },
      orderBy: [
        { tahun: 'desc' },
        { bulan: 'desc' }
      ]
    })

    const result = await Promise.all(riwayat.map(async (lap) => {
      const jumlahDinilai = await prisma.monitoringPenugasan.count({
        where: {
          assignment: { satkerId },
          tanggalMonitoring: {
            gte: new Date(lap.tahun, lap.bulan - 1, 1),
            lt: new Date(lap.tahun, lap.bulan, 1)
          }
        }
      })

      return {
        id: lap.id,
        bulan: lap.bulan,
        tahun: lap.tahun,
        status: lap.status,
        createdAt: lap.createdAt,
        jumlahDinilai
      }
    }))

    return result
  } catch (error) {
    console.error("Get riwayat laporan error:", error)
    return []
  }
}

