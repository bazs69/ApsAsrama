"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { KehadiranApel } from "@prisma/client"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { AttendanceBusiness } from "@/lib/business/attendanceBusiness"
import { BusinessError } from "@/lib/business/businessErrors"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export async function createApel(formData: { tanggal: Date; keterangan?: string }) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const validDate = AttendanceBusiness.validateAttendanceDate(formData.tanggal, "Tanggal Apel")

    // [A-04 FIX] Prevent duplicate Apel on the same date
    const startOfDay = new Date(validDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(validDate)
    endOfDay.setHours(23, 59, 59, 999)

    // [R-03 FIX] Wrap create Apel + createMany AbsensiApel in a single atomic transaction.
    // If createMany fails, Apel is rolled back — no orphan Apel records.
    // [5B.4] Pindahkan pengecekan duplikat ke dalam transaksi untuk mencegah race condition.
    const apelId = await prisma.$transaction(async (tx) => {
      const existing = await tx.apel.findFirst({
        where: { tanggal: { gte: startOfDay, lte: endOfDay } }
      })
      if (existing) {
        throw BusinessError.alreadyExists("Apel pada tanggal tersebut")
      }

      const apel = await tx.apel.create({
        data: {
          tanggal: validDate,
          keterangan: formData.keterangan || null,
        },
      })

      const activeResidents = await tx.resident.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      })

      if (activeResidents.length > 0) {
        await tx.absensiApel.createMany({
          data: activeResidents.map(r => ({
            apelId: apel.id,
            residentId: r.id,
            status: KehadiranApel.HADIR,
          })),
        })
      }

      return apel.id
    })

    revalidatePath("/dashboard/absensi/apel")
    return { success: true, apelId }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Absen Apel")
    return { error: businessErr.message }
  }
}

export async function getApels() {
  try {
    const apels = await prisma.apel.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        _count: {
          select: { absensi: true }
        },
        absensi: {
          where: { status: "HADIR" },
          select: { id: true }
        }
      }
    })

    return apels.map(k => ({
      id: k.id,
      tanggal: k.tanggal,
      keterangan: k.keterangan,
      totalCount: k._count.absensi,
      hadirCount: k.absensi.length
    }))
  } catch (error) {
    logOperationalError({ action: "Error getApels:", error: error })
    return []
  }
}

export async function getApelsPaginated(options: { page: number; pageSize: number; search?: string }) {
  try {
    const { page, pageSize, search } = options
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where = search ? {
      keterangan: { contains: search, mode: "insensitive" as const }
    } : {}

    const [total, data] = await prisma.$transaction([
      prisma.apel.count({ where }),
      prisma.apel.findMany({
        where,
        orderBy: { tanggal: "desc" },
        skip,
        take,
        include: {
          _count: {
            select: { absensi: true }
          },
          absensi: {
            where: { status: "HADIR" },
            select: { id: true }
          }
        }
      })
    ])

    const totalPages = Math.ceil(total / pageSize)
    
    return {
      data: data.map(k => ({
        id: k.id,
        tanggal: k.tanggal,
        keterangan: k.keterangan,
        totalCount: k._count.absensi,
        hadirCount: k.absensi.length
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  } catch (error) {
    logOperationalError({ action: "Failed to fetch paginated apels:", error: error })
    return { data: [], pagination: { page: options.page, pageSize: options.pageSize, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }
  }
}

export async function getApelDetail(id: string) {
  try {
    return await prisma.apel.findUnique({
      where: { id },
      include: {
        absensi: {
          include: {
            resident: {
              select: { id: true, name: true }
            }
          },
          orderBy: {
            resident: { name: "asc" }
          }
        }
      }
    })
  } catch (error) {
    logOperationalError({ action: "Error getApelDetail:", error: error })
    return null
  }
}

export async function updateAbsensiApelStatus(absensiId: string, status: KehadiranApel) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const validStatus = AttendanceBusiness.validateApelStatus(status)

    await prisma.absensiApel.update({
      where: { id: absensiId },
      data: { status: validStatus },
    })
    revalidatePath("/dashboard/absensi/apel")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Status Absensi Apel")
    return { error: businessErr.message }
  }
}

export async function deleteApel(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    await prisma.apel.delete({
      where: { id },
    })
    revalidatePath("/dashboard/absensi/apel")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Hapus Apel")
    return { error: businessErr.message }
  }
}

export async function updateApel(
  id: string,
  formData: { tanggal: Date; keterangan?: string }
) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const validDate = AttendanceBusiness.validateAttendanceDate(formData.tanggal, "Tanggal Apel")

    await prisma.apel.update({
      where: { id },
      data: {
        tanggal: validDate,
        keterangan: formData.keterangan || null,
      },
    })
    revalidatePath("/dashboard/absensi/apel")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Perbarui Apel")
    return { error: businessErr.message }
  }
}

export async function getAllAbsensiApelDetail() {
  try {
    return await prisma.apel.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        absensi: {
          include: {
            resident: {
              select: { name: true }
            }
          },
          orderBy: {
            resident: { name: "asc" }
          }
        }
      }
    })
  } catch (error) {
    logOperationalError({ action: "Error getAllAbsensiApelDetail:", error: error })
    return []
  }
}
