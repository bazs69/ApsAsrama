"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ResidentStatus, RoomStatus, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { BusinessNormalizer } from "@/lib/business/businessNormalizer"
import { ResidentBusiness } from "@/lib/business/residentBusiness"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"
import { logOperationalError } from "@/lib/business/businessLogger"
import { normalizeBusinessError } from "@/lib/business/errorNormalizer"

function cleanText(value: unknown) {
  return BusinessNormalizer.normalizeWhitespace(String(value ?? ""))
}

function normalizeGender(value: unknown) {
  const normalized = cleanText(value).toLowerCase().replace(/[\s_-]/g, "")
  if (["l", "lk", "lakilaki", "pria"].includes(normalized)) return "LAKI_LAKI"
  if (["p", "pr", "perempuan", "wanita"].includes(normalized)) return "PEREMPUAN"
  return cleanText(value)
}

export async function getResidents() {
  try {
    return await prisma.resident.findMany({
      orderBy: { name: "asc" },
      include: {
        room: true,
        assignments: {
          include: {
            satker: true
          }
        }
      }
    })
  } catch (error) {
    logOperationalError({ action: "getResidents", error })
    return []
  }
}

export async function getResidentsPaginated(options: { page: number; pageSize: number; search?: string }) {
  try {
    const { page, pageSize, search } = options
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { nim: { contains: search, mode: "insensitive" as const } },
      ]
    } : {}

    const [total, data] = await prisma.$transaction([
      prisma.resident.count({ where }),
      prisma.resident.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take,
        include: {
          room: true,
          assignments: {
            include: {
              satker: true
            }
          }
        }
      })
    ])

    const totalPages = Math.ceil(total / pageSize)
    return {
      data,
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
    logOperationalError({ action: "getResidentsPaginated", error })
    return { data: [], pagination: { page: options.page, pageSize: options.pageSize, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }
  }
}

export async function getResidentOptions() {
  try {
    return await prisma.resident.findMany({
      where: { status: ResidentStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nim: true,
        status: true,
      },
    })
  } catch (error) {
    logOperationalError({ action: "getResidentOptions", error })
    return []
  }
}

export async function createResident(formData: {
  name: string
  nim?: string
  niup?: string
  angkatan?: string
  prodi?: string
  wilayah?: string
  daerah?: string
  kotaAsal?: string
  fakultas?: string
  phone?: string
  roomId?: string
  status: ResidentStatus
  photo?: string | null
  asalCountryId?: string
  asalProvinceId?: string
  asalRegencyId?: string
  asalDistrictId?: string
  asalVillageId?: string
  tempatLahir?: string
  tanggalLahir?: string | Date
  gender?: string
  nik?: string
  alamatLengkap?: string
  kodePos?: string
  fakultasId?: string
  prodiId?: string
  angkatanId?: string
}) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const cleanName = BusinessValidation.requireName(formData.name, "Nama Lengkap")
    const gender = normalizeGender(formData.gender)
    if (gender !== "LAKI_LAKI" && gender !== "PEREMPUAN") {
      throw BusinessError.validation("Jenis Kelamin harus diisi LAKI_LAKI atau PEREMPUAN.")
    }
    if (!formData.tanggalLahir || Number.isNaN(new Date(formData.tanggalLahir).getTime())) {
      throw BusinessError.validation("Tanggal Lahir tidak valid.")
    }

    const nim = cleanText(formData.nim) || null
    const niup = cleanText(formData.niup) || null
    const nik = cleanText(formData.nik) || null
    const phone = cleanText(formData.phone) || null

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const resident = await prisma.$transaction(async (tx) => {
      // 1. Validate identity uniqueness
      await ResidentBusiness.validateResidentIdentity(tx, { nim, niup, nik, phone })

      // 2. Validate academic hierarchy
      await ResidentBusiness.validateAcademicHierarchy(tx, {
        fakultasId: formData.fakultasId,
        prodiId: formData.prodiId,
        angkatanId: formData.angkatanId
      })

      // 3. Validate room assignment if provided
      if (formData.roomId) {
        // [5B.5] Resident Business Invariant
        const newStatus = formData.status || ResidentStatus.ACTIVE
        if (newStatus !== ResidentStatus.ACTIVE) {
          throw BusinessError.validation("Santri dengan status tidak aktif (INACTIVE/GRADUATED) tidak boleh menempati kamar.")
        }
        await ResidentBusiness.validateRoomAssignment(tx, formData.roomId)
      }

      // 4. Create resident
      const created = await tx.resident.create({
        data: {
          name: cleanName,
          photo: formData.photo || null,
          nim,
          niup,
          angkatan: cleanText(formData.angkatan) || null,
          prodi: cleanText(formData.prodi) || null,
          wilayah: cleanText(formData.wilayah) || null,
          daerah: cleanText(formData.daerah) || null,
          kotaAsal: cleanText(formData.kotaAsal) || null,
          fakultas: cleanText(formData.fakultas) || null,
          phone,
          roomId: formData.roomId || null,
          status: formData.status || ResidentStatus.ACTIVE,
          asalCountryId: formData.asalCountryId || null,
          asalProvinceId: formData.asalProvinceId || null,
          asalRegencyId: formData.asalRegencyId || null,
          asalDistrictId: formData.asalDistrictId || null,
          asalVillageId: formData.asalVillageId || null,
          tempatLahir: cleanText(formData.tempatLahir) || null,
          tanggalLahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : null,
          gender,
          nik,
          alamatLengkap: cleanText(formData.alamatLengkap) || null,
          kodePos: cleanText(formData.kodePos) || null,
          fakultasId: formData.fakultasId || null,
          prodiId: formData.prodiId || null,
          angkatanId: formData.angkatanId || null
        }
      })

      // 5. Update room status if full
      if (formData.roomId) {
        const room = await tx.room.findUnique({
          where: { id: formData.roomId },
          include: { residents: true }
        })
        if (room && room.residents.length >= room.capacity) {
          await tx.room.update({
            where: { id: formData.roomId },
            data: { status: RoomStatus.OCCUPIED }
          })
        }
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          action: "CREATE_RESIDENT",
          entityType: "RESIDENT",
          entityId: created.id,
          performedBy,
          newValue: JSON.parse(JSON.stringify(created)) as Prisma.InputJsonValue
        }
      })

      return created
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true, resident }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Santri")
    return { error: businessErr.message }
  }
}

export async function updateResident(
  id: string,
  formData: {
    name: string
    nim?: string
    niup?: string
    angkatan?: string
    prodi?: string
    wilayah?: string
    daerah?: string
    kotaAsal?: string
    fakultas?: string
    phone?: string
    roomId?: string
    status: ResidentStatus
    photo?: string | null
    asalCountryId?: string
    asalProvinceId?: string
    asalRegencyId?: string
    asalDistrictId?: string
    asalVillageId?: string
    tempatLahir?: string
    tanggalLahir?: string | Date
    gender?: string
    nik?: string
    alamatLengkap?: string
    kodePos?: string
    fakultasId?: string
    prodiId?: string
    angkatanId?: string
  }
) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const cleanName = BusinessValidation.requireName(formData.name, "Nama Lengkap")
    const gender = normalizeGender(formData.gender)
    if (gender !== "LAKI_LAKI" && gender !== "PEREMPUAN") {
      throw BusinessError.validation("Jenis Kelamin harus diisi LAKI_LAKI atau PEREMPUAN.")
    }

    const nim = cleanText(formData.nim) || null
    const niup = cleanText(formData.niup) || null
    const nik = cleanText(formData.nik) || null
    const phone = cleanText(formData.phone) || null

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const resident = await prisma.$transaction(async (tx) => {
      const oldResident = await tx.resident.findUnique({ where: { id } })
      if (!oldResident) {
        throw BusinessError.conflict("Santri")
      }

      // 1. Validate identity uniqueness excluding self
      await ResidentBusiness.validateResidentIdentity(tx, { nim, niup, nik, phone }, id)

      // 2. Validate academic hierarchy
      await ResidentBusiness.validateAcademicHierarchy(tx, {
        fakultasId: formData.fakultasId,
        prodiId: formData.prodiId,
        angkatanId: formData.angkatanId
      })

      const oldRoomId = oldResident.roomId

      // 3. Check room if changed
      if (formData.roomId && formData.roomId !== oldRoomId) {
        // [5B.5] Resident Business Invariant
        const newStatus = formData.status || oldResident.status
        if (newStatus !== ResidentStatus.ACTIVE) {
          throw BusinessError.validation("Santri dengan status tidak aktif (INACTIVE/GRADUATED) tidak boleh dipindahkan atau dimasukkan ke kamar.")
        }
        await ResidentBusiness.validateRoomAssignment(tx, formData.roomId, id)
      }

      // [5B.3] Resident Lifecycle State Guard
      const newStatus = formData.status || oldResident.status
      if (oldResident.status === ResidentStatus.ACTIVE && newStatus === ResidentStatus.INACTIVE) {
        // Guard 1: Cannot change status if still has active assignments
        const activeAssignments = await tx.assignment.count({
          where: { residentId: id, status: "ACTIVE" }
        })
        if (activeAssignments > 0) {
          throw BusinessError.validation("Resident masih memiliki penugasan aktif. Selesaikan atau transfer penugasan terlebih dahulu.")
        }

        // Guard 2: Cannot change status if still occupies a room
        const finalRoomId = formData.roomId !== undefined ? formData.roomId : oldResident.roomId
        if (finalRoomId !== null) {
          throw BusinessError.validation("Resident masih menempati kamar. Keluarkan dari kamar terlebih dahulu.")
        }
      }

      const updated = await tx.resident.update({
        where: { id },
        data: {
          name: cleanName,
          photo: formData.photo !== undefined ? formData.photo : oldResident.photo,
          nim,
          niup,
          angkatan: cleanText(formData.angkatan) || null,
          prodi: cleanText(formData.prodi) || null,
          wilayah: cleanText(formData.wilayah) || null,
          daerah: cleanText(formData.daerah) || null,
          kotaAsal: cleanText(formData.kotaAsal) || null,
          fakultas: cleanText(formData.fakultas) || null,
          phone,
          roomId: formData.roomId || null,
          status: formData.status || oldResident.status,
          asalCountryId: formData.asalCountryId || null,
          asalProvinceId: formData.asalProvinceId || null,
          asalRegencyId: formData.asalRegencyId || null,
          asalDistrictId: formData.asalDistrictId || null,
          asalVillageId: formData.asalVillageId || null,
          tempatLahir: cleanText(formData.tempatLahir) || null,
          tanggalLahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : oldResident.tanggalLahir,
          gender,
          nik,
          alamatLengkap: cleanText(formData.alamatLengkap) || null,
          kodePos: cleanText(formData.kodePos) || null,
          fakultasId: formData.fakultasId || null,
          prodiId: formData.prodiId || null,
          angkatanId: formData.angkatanId || null
        }
      })

      // 4. Update old and new room statuses
      // [R-01 FIX] Count remaining residents in old room after this resident moves out.
      // Only set to AVAILABLE if no other residents remain — prevents false availability.
      if (oldRoomId && oldRoomId !== formData.roomId) {
        const oldRoomAfterMove = await tx.room.findUnique({
          where: { id: oldRoomId },
          include: { residents: { select: { id: true } } }
        })
        // Exclude the current resident (already updated above) from count
        const remainingOccupants = (oldRoomAfterMove?.residents ?? []).filter(r => r.id !== id).length
        if (remainingOccupants === 0) {
          await tx.room.update({
            where: { id: oldRoomId },
            data: { status: RoomStatus.AVAILABLE }
          })
        }
        // If remainingOccupants > 0, retain OCCUPIED status — do NOT change it
      }

      if (formData.roomId) {
        const room = await tx.room.findUnique({
          where: { id: formData.roomId },
          include: { residents: true }
        })
        if (room && room.residents.length >= room.capacity) {
          await tx.room.update({
            where: { id: formData.roomId },
            data: { status: RoomStatus.OCCUPIED }
          })
        }
      }

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          action: "UPDATE_RESIDENT",
          entityType: "RESIDENT",
          entityId: id,
          performedBy,
          oldValue: JSON.parse(JSON.stringify(oldResident)) as Prisma.InputJsonValue,
          newValue: JSON.parse(JSON.stringify(updated)) as Prisma.InputJsonValue
        }
      })

      return updated
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true, resident }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Santri")
    return { error: businessErr.message }
  }
}

export async function deleteResident(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    await prisma.$transaction(async (tx) => {
      const resident = await tx.resident.findUnique({
        where: { id },
        include: { _count: { select: { assignments: true, absensiApel: true, absensiKegiatan: true } } }
      })

      if (!resident) {
        throw BusinessError.conflict("Santri")
      }

      if (resident._count.assignments > 0 || resident._count.absensiApel > 0 || resident._count.absensiKegiatan > 0) {
        throw BusinessError.cannotDelete("Santri", "Penugasan atau Riwayat Absensi")
      }

      const oldRoomId = resident.roomId

      await tx.resident.delete({ where: { id } })

      if (oldRoomId) {
        await tx.room.update({
          where: { id: oldRoomId },
          data: { status: RoomStatus.AVAILABLE }
        })
      }

      await tx.auditLog.create({
        data: {
          action: "DELETE_RESIDENT",
          entityType: "RESIDENT",
          entityId: id,
          performedBy,
          oldValue: JSON.parse(JSON.stringify(resident)) as Prisma.InputJsonValue
        }
      })
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Santri")
    return { error: businessErr.message }
  }
}

export async function bulkCreateResidents(data: {
  name: string
  nim?: string
  niup?: string
  phone?: string
  angkatan?: string
  prodi?: string
  wilayah?: string
  daerah?: string
  kotaAsal?: string
  fakultas?: string
  roomNumber?: string
  tempatLahir?: string
  tanggalLahir?: string | Date
  gender?: string
  nik?: string
  alamatLengkap?: string
  kodePos?: string
}[]) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    // Pre-validate in memory
    ResidentBusiness.validateBulkResidents(data)

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const result = await prisma.$transaction(async (tx) => {
      let successCount = 0

      // Get all rooms to lookup ID by number
      const rooms = await tx.room.findMany({ include: { _count: { select: { residents: true } } } })
      const roomMap = new Map<string, typeof rooms[0] & { tempOccupancy: number }>()
      rooms.forEach(r => roomMap.set(r.number, { ...r, tempOccupancy: r._count.residents }))

      for (const row of data) {
        const cleanName = BusinessValidation.requireName(row.name, "Nama Lengkap")
        const nim = cleanText(row.nim) || null
        const niup = cleanText(row.niup) || null
        const nik = cleanText(row.nik) || null
        const phone = cleanText(row.phone) || null

        await ResidentBusiness.validateResidentIdentity(tx, { nim, niup, nik, phone })

        let roomId: string | null = null
        if (row.roomNumber) {
          const room = roomMap.get(String(row.roomNumber))
          if (!room) throw BusinessError.invalidReference(`Kamar ${row.roomNumber}`)
          if (room.status === RoomStatus.MAINTENANCE) {
            throw BusinessError.validation(`Kamar ${row.roomNumber} sedang maintenance.`)
          }
          if (room.tempOccupancy >= room.capacity) {
            throw BusinessError.validation(`Kamar ${row.roomNumber} sudah penuh.`)
          }
          roomId = room.id
          room.tempOccupancy++
          if (room.tempOccupancy >= room.capacity) {
            await tx.room.update({ where: { id: room.id }, data: { status: RoomStatus.OCCUPIED } })
          }
        }

        await tx.resident.create({
          data: {
            name: cleanName,
            nim,
            niup,
            phone,
            angkatan: cleanText(row.angkatan) || null,
            prodi: cleanText(row.prodi) || null,
            wilayah: cleanText(row.wilayah) || null,
            daerah: cleanText(row.daerah) || null,
            kotaAsal: cleanText(row.kotaAsal) || null,
            fakultas: cleanText(row.fakultas) || null,
            tempatLahir: cleanText(row.tempatLahir) || null,
            tanggalLahir: row.tanggalLahir ? new Date(row.tanggalLahir) : null,
            gender: normalizeGender(row.gender) || null,
            nik,
            alamatLengkap: cleanText(row.alamatLengkap) || null,
            kodePos: cleanText(row.kodePos) || null,
            roomId,
            status: ResidentStatus.ACTIVE
          }
        })
        successCount++
      }

      await tx.auditLog.create({
        data: {
          action: "BULK_IMPORT_RESIDENTS",
          entityType: "RESIDENT",
          performedBy,
          newValue: JSON.stringify({ successCount })
        }
      })

      return successCount
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true, successCount: result, skippedCount: 0 }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Import Santri")
    return { error: businessErr.message }
  }
}

export async function bulkDeleteResidents(ids: string[]) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    await prisma.$transaction(async (tx) => {
      const residents = await tx.resident.findMany({
        where: { id: { in: ids } },
        include: { _count: { select: { assignments: true, absensiApel: true, absensiKegiatan: true } } }
      })

      for (const res of residents) {
        if (res._count.assignments > 0 || res._count.absensiApel > 0 || res._count.absensiKegiatan > 0) {
          throw BusinessError.cannotDelete(`Santri ${res.name}`, "Penugasan atau Riwayat Absensi")
        }
      }

      const roomIds = Array.from(new Set(residents.map(r => r.roomId).filter(Boolean) as string[]))

      await tx.resident.deleteMany({
        where: { id: { in: ids } }
      })

      if (roomIds.length > 0) {
        await tx.room.updateMany({
          where: { id: { in: roomIds } },
          data: { status: RoomStatus.AVAILABLE }
        })
      }

      await tx.auditLog.create({
        data: {
          action: "BULK_DELETE_RESIDENTS",
          entityType: "RESIDENT",
          performedBy,
          oldValue: JSON.stringify({ count: ids.length, ids })
        }
      })
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Hapus Santri")
    return { error: businessErr.message }
  }
}

export async function bulkMoveResidents(ids: string[], data: { roomId?: string }) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    await prisma.$transaction(async (tx) => {
      // Fetch residents with their current room info for history recording
      const residents = await tx.resident.findMany({
        where: { id: { in: ids } },
        select: { id: true, roomId: true, wilayah: true, daerah: true, room: { select: { number: true } } }
      })
      const oldRoomIds = Array.from(new Set(residents.map(r => r.roomId).filter(Boolean) as string[]))

      // Fetch new room details for history recording
      let newRoomDetail: { number: string; daerah?: { name: string; wilayah?: { name: string } | null } | null } | null = null
      if (data.roomId) {
        await ResidentBusiness.validateRoomAssignment(tx, data.roomId, undefined, ids.length)
        newRoomDetail = await tx.room.findUnique({
          where: { id: data.roomId },
          include: { daerah: { include: { wilayah: true } } }
        })
      }

      const newWilayah = newRoomDetail?.daerah?.wilayah?.name || null
      const newDaerah = newRoomDetail?.daerah?.name || null

      await tx.resident.updateMany({
        where: { id: { in: ids } },
        data: {
          roomId: data.roomId !== undefined ? data.roomId : undefined,
          wilayah: data.roomId !== undefined ? newWilayah : undefined,
          daerah: data.roomId !== undefined ? newDaerah : undefined
        }
      })

      // [R-02 FIX] Record per-resident room history for full audit trail.
      // Consistent with single-resident transferResidentRoom which records history.
      if (residents.length > 0) {
        await tx.residentRoomHistory.createMany({
          data: residents.map(r => ({
            residentId: r.id,
            fromRoomId: r.roomId || null,
            fromRoom: r.room?.number || null,
            toRoomId: data.roomId || null,
            toRoom: newRoomDetail?.number || null,
            fromWilayah: r.wilayah || null,
            fromDaerah: r.daerah || null,
            toWilayah: newWilayah,
            toDaerah: newDaerah,
            alasan: "Perpindahan massal",
            transferedBy: performedBy
          }))
        })
      }

      if (oldRoomIds.length > 0) {
        await tx.room.updateMany({
          where: { id: { in: oldRoomIds } },
          data: { status: RoomStatus.AVAILABLE }
        })
      }

      if (data.roomId) {
        const room = await tx.room.findUnique({
          where: { id: data.roomId },
          include: { residents: true }
        })
        if (room && room.residents.length >= room.capacity) {
          await tx.room.update({
            where: { id: data.roomId },
            data: { status: RoomStatus.OCCUPIED }
          })
        }
      }

      await tx.auditLog.create({
        data: {
          action: "BULK_MOVE_RESIDENTS",
          entityType: "RESIDENT",
          performedBy,
          newValue: JSON.stringify({ count: ids.length, targetRoomId: data.roomId, newWilayah, newDaerah })
        }
      })
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Pindah Kamar")
    return { error: businessErr.message }
  }
}

