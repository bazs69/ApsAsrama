"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { KehadiranStatus, ResidentStatus } from "@prisma/client"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { AttendanceBusiness } from "@/lib/business/attendanceBusiness"
import { ActivityBusiness } from "@/lib/business/activityBusiness"
import { BusinessError } from "@/lib/business/businessErrors"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export async function getKegiatans() {
  try {
    const kegiatans = await prisma.kegiatan.findMany({
      include: {
        absensi: true
      },
      orderBy: { tanggal: "desc" },
    })
    
    return kegiatans.map(k => {
      const hadirCount = k.absensi.filter(a => a.status === KehadiranStatus.HADIR).length
      const totalCount = k.absensi.length
      return {
        ...k,
        hadirCount,
        totalCount
      }
    })
  } catch (error) {
    logOperationalError({ action: "Failed to fetch kegiatans:", error: error })
    return []
  }
}

export async function getKegiatansPaginated(options: { page: number; pageSize: number; search?: string }) {
  try {
    const { page, pageSize, search } = options
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where = search ? {
      OR: [
        { nama: { contains: search, mode: "insensitive" as const } },
        { keterangan: { contains: search, mode: "insensitive" as const } }
      ]
    } : {}

    const [total, data] = await prisma.$transaction([
      prisma.kegiatan.count({ where }),
      prisma.kegiatan.findMany({
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
        ...k,
        hadirCount: k.absensi.length,
        totalCount: k._count.absensi
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
    logOperationalError({ action: "Failed to fetch paginated kegiatans:", error: error })
    return { data: [], pagination: { page: options.page, pageSize: options.pageSize, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }
  }
}

export async function getKegiatanDetail(id: string) {
  try {
    return await prisma.kegiatan.findUnique({
      where: { id },
      include: {
        absensi: {
          include: {
            resident: true
          },
          orderBy: {
            resident: { name: "asc" }
          }
        }
      }
    })
  } catch (error) {
    logOperationalError({ action: "Failed to fetch kegiatan detail:", error: error })
    return null
  }
}

export async function createKegiatan(formData: {
  nama: string
  tanggal: Date
  keterangan?: string
}) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const validName = ActivityBusiness.validateActivityName(formData.nama)
    const validDate = ActivityBusiness.validateActivityDate(formData.tanggal)

    const kegiatanId = await prisma.$transaction(async (tx) => {
      // Pengecekan duplikat di dalam transaksi
      const startOfDay = new Date(validDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(validDate)
      endOfDay.setHours(23, 59, 59, 999)

      const existing = await tx.kegiatan.findFirst({
        where: {
          nama: validName,
          tanggal: { gte: startOfDay, lte: endOfDay }
        }
      })
      if (existing) {
        throw BusinessError.alreadyExists(`Kegiatan '${validName}' pada tanggal tersebut`)
      }

      const kegiatan = await tx.kegiatan.create({
        data: {
          nama: validName,
          tanggal: validDate,
          keterangan: formData.keterangan || null,
        }
      })

      const activeResidents = await tx.resident.findMany({
        where: { status: ResidentStatus.ACTIVE }
      })

      if (activeResidents.length > 0) {
        await tx.absensiKegiatan.createMany({
          data: activeResidents.map(r => ({
            kegiatanId: kegiatan.id,
            residentId: r.id,
            status: KehadiranStatus.HADIR
          }))
        })
      }

      return kegiatan.id
    })

    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true, kegiatanId }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Kegiatan Absensi")
    return { error: businessErr.message }
  }
}

export async function updateAbsensiKegiatanStatus(
  absensiId: string, 
  status: KehadiranStatus, 
  keterangan: string = ""
) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const validStatus = AttendanceBusiness.validateKegiatanStatus(status)

    await prisma.absensiKegiatan.update({
      where: { id: absensiId },
      data: { 
        status: validStatus, 
        keterangan: keterangan || null 
      }
    })
    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Status Kehadiran")
    return { error: businessErr.message }
  }
}

export async function deleteKegiatan(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    await prisma.kegiatan.delete({
      where: { id },
    })
    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Hapus Kegiatan")
    return { error: businessErr.message }
  }
}

export async function updateKegiatan(
  id: string,
  formData: { nama: string; tanggal: Date; keterangan?: string }
) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const validName = ActivityBusiness.validateActivityName(formData.nama)
    const validDate = ActivityBusiness.validateActivityDate(formData.tanggal)

    await prisma.kegiatan.update({
      where: { id },
      data: {
        nama: validName,
        tanggal: validDate,
        keterangan: formData.keterangan || null,
      },
    })
    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Perbarui Kegiatan")
    return { error: businessErr.message }
  }
}

export async function getAllAbsensiDetail() {
  try {
    return await prisma.kegiatan.findMany({
      include: {
        absensi: {
          include: {
            resident: true
          }
        }
      },
      orderBy: { tanggal: "desc" },
    })
  } catch (error) {
    logOperationalError({ action: "Failed to fetch all absensi detail:", error: error })
    return []
  }
}
