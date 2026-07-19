"use server"

import prisma from "@/lib/prisma"

// Existing getDashboardStats
export async function getDashboardStats() {
  try {
    const totalSantri = await prisma.resident.count({
      where: { status: "ACTIVE" }
    })

    const totalSatker = await prisma.satker.count()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const kegiatanHadir = await prisma.absensiKegiatan.count({ where: { status: "HADIR", createdAt: { gte: today, lt: tomorrow } } })
    const kegiatanIzin = await prisma.absensiKegiatan.count({ where: { status: "IZIN", createdAt: { gte: today, lt: tomorrow } } })
    const kegiatanSakit = await prisma.absensiKegiatan.count({ where: { status: "SAKIT", createdAt: { gte: today, lt: tomorrow } } })
    const kegiatanAlpa = await prisma.absensiKegiatan.count({ where: { status: "ALPA", createdAt: { gte: today, lt: tomorrow } } })

    const apelHadir = await prisma.absensiApel.count({ where: { status: "HADIR", createdAt: { gte: today, lt: tomorrow } } })
    const apelIzin = await prisma.absensiApel.count({ where: { status: "IZIN", createdAt: { gte: today, lt: tomorrow } } })
    const apelAlpa = await prisma.absensiApel.count({ where: { status: "ALPA", createdAt: { gte: today, lt: tomorrow } } })

    const totalHadir = kegiatanHadir + apelHadir
    const totalIzinSakit = kegiatanIzin + kegiatanSakit + apelIzin
    const totalAlpa = kegiatanAlpa + apelAlpa
    const totalAbsensi = totalHadir + totalIzinSakit + totalAlpa
    
    const kehadiranPercentage = totalAbsensi > 0 ? Math.round((totalHadir / totalAbsensi) * 100) : 0

    const currentMonth = today.getMonth() + 1
    const currentDay = today.getDate()
    
    const birthdays = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id, 
        r.name, 
        r.nim, 
        r."tanggalLahir",
        rm.number as room_number
      FROM "Resident" r
      LEFT JOIN "Room" rm ON r."roomId" = rm.id
      WHERE r.status = 'ACTIVE' 
        AND r."tanggalLahir" IS NOT NULL
        AND EXTRACT(MONTH FROM r."tanggalLahir") = ${currentMonth}
        AND EXTRACT(DAY FROM r."tanggalLahir") = ${currentDay}
    `

    const currentYear = today.getFullYear()
    const mappedBirthdays = birthdays.map((b) => {
      const birthYear = new Date(b.tanggalLahir).getFullYear()
      return {
        id: b.id,
        name: b.name,
        nim: b.nim || "-",
        room: b.room_number || "-",
        age: currentYear - birthYear
      }
    })

    return {
      success: true,
      data: {
        totalSantri,
        totalSatker,
        kehadiran: {
          percentage: kehadiranPercentage,
          hadir: totalHadir,
          izinSakit: totalIzinSakit,
          alpa: totalAlpa
        },
        birthdays: mappedBirthdays
      }
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return { success: false, error: "Gagal mengambil data statistik." }
  }
}

// New action to get recent activities from AuditLog
export async function getRecentActivities() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const activities = logs.map(log => {
      // Determine category based on entity type or action
      let category = "SYSTEM"
      if (log.entityType === "Assignment" || log.entityType === "Penugasan") category = "ASSIGNMENT"
      if (log.entityType.includes("Absensi")) category = "ABSENSI"
      if (log.entityType === "Monitoring") category = "MONITORING"
      if (log.action.includes("DELETE") || log.action.includes("SECURITY")) category = "SECURITY"

      // Create a readable title
      let title = "Aktivitas Sistem"
      if (log.action === "CREATE") title = `Menambahkan Data ${log.entityType}`
      else if (log.action === "UPDATE") title = `Memperbarui Data ${log.entityType}`
      else if (log.action === "DELETE") title = `Menghapus Data ${log.entityType}`
      else title = log.action

      // Description
      const desc = log.entityId ? `Aktivitas pada entitas ID: ${log.entityId.substring(0, 8)}...` : `Tindakan ${log.action} dilakukan.`

      return {
        id: log.id,
        title,
        description: desc,
        timestamp: log.createdAt.toISOString(),
        actor: log.performedBy || "System",
        category,
        meta: log.entityType
      }
    })

    return { success: true, data: activities }
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return { success: false, error: "Gagal mengambil data aktivitas." }
  }
}
