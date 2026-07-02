"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { RoomStatus, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { BusinessNormalizer } from "@/lib/business/businessNormalizer"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export async function getRooms() {
  try {
    return await prisma.room.findMany({
      orderBy: { number: "asc" },
      include: {
        residents: {
          select: { id: true, name: true, nim: true }
        }
      }
    })
  } catch (error) {
    logOperationalError({ action: "Failed to fetch rooms:", error: error })
    return []
  }
}

export async function createRoom(formData: {
  number: string
  floor: number
  capacity: number
  status: RoomStatus
}) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const cleanNumber = BusinessNormalizer.normalizeCode(BusinessValidation.requireName(formData.number, "Nomor Kamar"))

    const existing = await prisma.room.findFirst({
      where: { number: cleanNumber }
    })

    if (existing) {
      return { error: BusinessError.alreadyExists(`Kamar ${cleanNumber}`).message }
    }

    const room = await prisma.room.create({
      data: {
        number: cleanNumber,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
        status: formData.status
      }
    })

    // [M-02 FIX] Audit trail for Room creation
    await prisma.auditLog.create({
      data: {
        action: "CREATE_ROOM",
        entityType: "ROOM",
        entityId: room.id,
        performedBy,
        newValue: JSON.parse(JSON.stringify(room)) as Prisma.InputJsonValue
      }
    }).catch(e => logOperationalError({ action: "AuditLog failed:", error: e }))

    revalidatePath("/dashboard/rooms")
    return { success: true, room }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Kamar")
    return { error: businessErr.message }
  }
}

export async function updateRoom(
  id: string,
  formData: {
    number: string
    floor: number
    capacity: number
    status: RoomStatus
  }
) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const cleanNumber = BusinessNormalizer.normalizeCode(BusinessValidation.requireName(formData.number, "Nomor Kamar"))

    const room = await prisma.$transaction(async (tx) => {
      const exist = await tx.room.findUnique({
        where: { id },
        include: { residents: { select: { id: true } } }
      })
      if (!exist) {
        throw BusinessError.conflict("Kamar")
      }

      // [M-03] Prevent reducing capacity below current occupant count.
      const currentOccupants = exist.residents.length
      if (Number(formData.capacity) < currentOccupants) {
        throw BusinessError.validation(`Kapasitas kamar tidak boleh lebih kecil dari jumlah penghuni saat ini (${currentOccupants} santri).`)
      }

      // [5B.3] Room Workflow State Machine Guard
      // Cannot transition OCCUPIED -> MAINTENANCE if there are still residents.
      if (exist.status === "OCCUPIED" && formData.status === "MAINTENANCE" && currentOccupants > 0) {
        throw BusinessError.validation("Kamar masih berpenghuni. Pindahkan seluruh santri terlebih dahulu sebelum mengubah status menjadi MAINTENANCE.")
      }

      const duplicate = await tx.room.findFirst({
        where: {
          number: cleanNumber,
          NOT: { id }
        }
      })

      if (duplicate) {
        throw BusinessError.alreadyExists(`Kamar ${cleanNumber}`)
      }

      const updated = await tx.room.update({
        where: { id },
        data: {
          number: cleanNumber,
          floor: Number(formData.floor),
          capacity: Number(formData.capacity),
          status: formData.status
        }
      })

      // Audit Log for updateRoom
      await tx.auditLog.create({
        data: {
          action: "UPDATE_ROOM",
          entityType: "ROOM",
          entityId: updated.id,
          performedBy,
          oldValue: JSON.parse(JSON.stringify(exist)) as Prisma.InputJsonValue,
          newValue: JSON.parse(JSON.stringify(updated)) as Prisma.InputJsonValue
        }
      }).catch(e => logOperationalError({ action: "AuditLog failed:", error: e }))

      return updated
    })

    revalidatePath("/dashboard/rooms")
    return { success: true, room }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Kamar")
    return { error: businessErr.message }
  }
}

export async function deleteRoom(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const room = await prisma.room.findUnique({
      where: { id },
      include: { residents: true }
    })

    if (!room) {
      return { error: BusinessError.conflict("Kamar").message }
    }

    if (room.residents.length > 0) {
      return { error: BusinessError.cannotDelete(`Kamar ${room.number}`, "Santri").message }
    }

    await prisma.room.delete({
      where: { id }
    })

    // [M-02 FIX] Audit trail for Room deletion
    await prisma.auditLog.create({
      data: {
        action: "DELETE_ROOM",
        entityType: "ROOM",
        entityId: id,
        performedBy,
        oldValue: JSON.parse(JSON.stringify(room)) as Prisma.InputJsonValue
      }
    }).catch(e => logOperationalError({ action: "AuditLog failed:", error: e }))

    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Kamar")
    return { error: businessErr.message }
  }
}

