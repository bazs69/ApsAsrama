"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { RateLimiter, RATE_LIMITS, MemoryStore } from "@/lib/security/rateLimit"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { logAuditEvent } from "@/lib/security/auditLogger"
import { AuditAction } from "@/lib/security/auditActions"
import { calculateTotalScore, calculateAverageScore, calculatePredicate, getPredicateLabel, mapOldStatusToPredicate } from "@/lib/business/monitoringScoring"


const exportStore = new MemoryStore()
const exportLimiter = new RateLimiter(exportStore, RATE_LIMITS.EXPORT, "export")

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
      select: { statusMonitoring: true, averageScore: true, predicate: true }
    })

    let totalScore = 0
    let validCount = 0
    allMonitoring.forEach(m => {
      if (m.averageScore !== null) {
        totalScore += (m.averageScore / 5) * 100
        validCount++
      } else {
        const score = getScore(m.statusMonitoring)
        if (score > 0) {
          totalScore += (score / 4) * 100
          validCount++
        }
      }
    })

    const averageKeaktifan = validCount > 0 ? (totalScore / validCount) : 0

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
    const distribusi = { "Sangat Baik": 0, "Baik": 0, "Cukup": 0, "Kurang": 0, "Sangat Kurang": 0 }
    allMonitoring.forEach(m => {
      const predicate = m.predicate || mapOldStatusToPredicate(m.statusMonitoring)
      const label = getPredicateLabel(predicate)
      if (distribusi[label as keyof typeof distribusi] !== undefined) {
        distribusi[label as keyof typeof distribusi]++
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
    logOperationalError({ action: "Dashboard error:", error: error })
    return null
  }
}

export async function getRekapKeaktifanData(filters: { bulan?: number, tahun?: number, satkerId?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("dashboard.view")) return []

    const rlResult = await exportLimiter.consume(session.user.id)
    if (!rlResult.success) {
      try {

      } catch {
        // fail-open
      }
      return []
    }

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
        if (m.averageScore !== null) {
          totalScore += m.averageScore
          validCount++
        } else {
          const score = getScore(m.statusMonitoring)
          if (score > 0) {
            // Map old scale of 4 to 5
            totalScore += (score / 4) * 5
            validCount++
          }
        }
      })
      const averageScore = validCount > 0 ? (totalScore / validCount) : 0
      
      let statusLabel = "-"
      if (averageScore >= 4.5) statusLabel = "Sangat Baik"
      else if (averageScore >= 3.5) statusLabel = "Baik"
      else if (averageScore >= 2.5) statusLabel = "Cukup"
      else if (averageScore >= 1.5) statusLabel = "Kurang"
      else if (averageScore > 0) statusLabel = "Sangat Kurang"

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
    logOperationalError({ action: "Rekap error:", error: error })
    return []
  }
}

export async function logExportAction(fileName: string, reportType: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("laporan.export")) return { error: "Unauthorized" }

    const rlResult = await exportLimiter.consume(session.user.id)
    if (!rlResult.success) {
      try {

      } catch {
        // fail-open
      }
      return { error: "Too many export requests. Please wait before exporting again." }
    }

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
    logOperationalError({ action: "Log export error:", error: error })
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

    const rlResult = await exportLimiter.consume(session.user.id)
    if (!rlResult.success) {
      try {

      } catch {
        // fail-open
      }
      return []
    }

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
      // Handle both old and new filters
      if (["Sangat Baik", "Baik", "Cukup", "Kurang", "Sangat Kurang"].includes(filters.status)) {
        where.statusMonitoring = filters.status
      } else {
        where.statusMonitoring = filters.status
      }
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
      status: m.statusMonitoring, // This contains the predicate string for new records
      catatan: m.supervisorNotes || m.catatanMonitoring || "-",
      tanggal: m.tanggalMonitoring
    }))
  } catch (error) {
    logOperationalError({ action: "Laporan monitoring error:", error: error })
    return []
  }
}

export async function getLaporanPenugasanData(filters: { bulan?: number, tahun?: number, satkerId?: string }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("penugasan.view")) return []

    const rlResult = await exportLimiter.consume(session.user.id)
    if (!rlResult.success) {
      try {

      } catch {
        // fail-open
      }
      return []
    }

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
    logOperationalError({ action: "Laporan penugasan error:", error: error })
    return []
  }
}

export async function deleteExportHistory(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    if (!session || !session.user.permissions?.includes("laporan.export")) {
      return { error: "Unauthorized" }
    }

    await prisma.exportHistory.delete({ where: { id } })
    revalidatePath("/dashboard/laporan")
    return { success: true }
  } catch (error) {
    logOperationalError({ action: "Delete export history error:", error: error })
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
        catatan: m.supervisorNotes || m.catatanMonitoring
      }))
    }
  } catch (error) {
    logOperationalError({ action: "Get detail santri error:", error: error })
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
    attendanceScore?: number
    disciplineScore?: number
    responsibilityScore?: number
    workQualityScore?: number
    attitudeScore?: number
    teamworkScore?: number
    supervisorNotes?: string
  }[]
}

export async function saveMonitoringSatker(input: SaveMonitoringSatkerInput) {
  try {
    if (!await checkCrudRateLimit()) return { success: false, error: "Too many requests." }

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
      // Calculate scores on backend side
      const scores = {
        attendanceScore: m.attendanceScore || 0,
        disciplineScore: m.disciplineScore || 0,
        responsibilityScore: m.responsibilityScore || 0,
        workQualityScore: m.workQualityScore || 0,
        attitudeScore: m.attitudeScore || 0,
        teamworkScore: m.teamworkScore || 0
      }
      
      const isScored = Object.values(scores).some(val => val > 0)
      
      const totalScore = isScored ? calculateTotalScore(scores) : null
      const averageScore = isScored ? calculateAverageScore(scores) : null
      const predicate = isScored ? calculatePredicate(averageScore as number) : null
      const predicateLabel = predicate ? getPredicateLabel(predicate) : ""

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
            statusMonitoring: predicateLabel || existingMonitoring.statusMonitoring,
            catatanMonitoring: m.supervisorNotes || existingMonitoring.catatanMonitoring,
            attendanceScore: scores.attendanceScore,
            disciplineScore: scores.disciplineScore,
            responsibilityScore: scores.responsibilityScore,
            workQualityScore: scores.workQualityScore,
            attitudeScore: scores.attitudeScore,
            teamworkScore: scores.teamworkScore,
            totalScore: totalScore,
            averageScore: averageScore,
            predicate: predicate,
            supervisorNotes: m.supervisorNotes,
            evaluatedAt: new Date(),
            evaluatedBy: session.user.id,
            updatedAt: new Date()
          }
        })
      } else {
        await prisma.monitoringPenugasan.create({
          data: {
            assignmentId: m.assignmentId,
            tanggalMonitoring: targetDate,
            statusMonitoring: predicateLabel || "-",
            catatanMonitoring: m.supervisorNotes,
            attendanceScore: scores.attendanceScore,
            disciplineScore: scores.disciplineScore,
            responsibilityScore: scores.responsibilityScore,
            workQualityScore: scores.workQualityScore,
            attitudeScore: scores.attitudeScore,
            teamworkScore: scores.teamworkScore,
            totalScore: totalScore,
            averageScore: averageScore,
            predicate: predicate,
            supervisorNotes: m.supervisorNotes,
            evaluatedAt: new Date(),
            evaluatedBy: session.user.id,
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
    logOperationalError({ action: "Save monitoring satker error:", error: error })
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
    logOperationalError({ action: "Get riwayat laporan error:", error: error })
    return []
  }
}

