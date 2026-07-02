"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AbsensiStatus } from "@prisma/client"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { AttendanceBusiness } from "@/lib/business/attendanceBusiness"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export async function getAbsensiMuallim() {
  try {
    return await prisma.absensiMuallim.findMany({
      include: {
        muallim: true
      },
      orderBy: { tanggal: "desc" },
    })
  } catch (error) {
    logOperationalError({ action: "Failed to fetch absensi muallim:", error: error })
    return []
  }
}

export async function createAbsensiMuallim(formData: {
  hari: string
  tanggal: Date
  muallimId: string
  status: AbsensiStatus
  keterangan?: string
}) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const validHari = BusinessValidation.requireName(formData.hari, "Hari")
    const validDate = AttendanceBusiness.validateAttendanceDate(formData.tanggal, "Tanggal Absensi Muallim")
    const validMuallimId = BusinessValidation.validateParent(formData.muallimId, "Muallim")
    const validStatus = AttendanceBusiness.validateMuallimStatus(formData.status)

    const absensi = await prisma.$transaction(async (tx) => {
      const muallimExists = await tx.muallim.findUnique({
        where: { id: validMuallimId },
        select: { id: true }
      })
      if (!muallimExists) {
        throw BusinessError.invalidReference("Muallim")
      }

      const startOfDay = new Date(validDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(validDate)
      endOfDay.setHours(23, 59, 59, 999)

      const existing = await tx.absensiMuallim.findFirst({
        where: {
          muallimId: validMuallimId,
          tanggal: { gte: startOfDay, lte: endOfDay }
        }
      })

      if (existing) {
        throw BusinessError.alreadyExists("Absensi Muallim pada tanggal tersebut")
      }

      return await tx.absensiMuallim.create({
        data: {
          hari: validHari,
          tanggal: validDate,
          muallimId: validMuallimId,
          status: validStatus,
          keterangan: formData.keterangan || null,
        },
        include: {
          muallim: true
        }
      })
    })

    revalidatePath("/dashboard/absensi/muallim")
    return { success: true, absensi }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Absensi Muallim")
    return { error: businessErr.message }
  }
}

export async function deleteAbsensiMuallim(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    await prisma.absensiMuallim.delete({
      where: { id },
    })

    revalidatePath("/dashboard/absensi/muallim")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Hapus Absensi Muallim")
    return { error: businessErr.message }
  }
}
