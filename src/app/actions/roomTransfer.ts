"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { ResidentBusiness } from "@/lib/business/residentBusiness"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export interface RoomTransferPayload {
  residentId: string
  newRoomId: string
  alasan?: string
}

export async function transferResidentRoom(payload: RoomTransferPayload) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const residentId = BusinessValidation.validateParent(payload.residentId, "Santri")
    const newRoomId = BusinessValidation.validateParent(payload.newRoomId, "Kamar Tujuan")

    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const result = await prisma.$transaction(async (tx) => {
      const resident = await tx.resident.findUnique({
        where: { id: residentId },
        include: { room: true }
      })

      if (!resident) {
        throw BusinessError.invalidReference("Santri")
      }

      if (resident.roomId === newRoomId) {
        throw BusinessError.validation("Santri sudah berada di kamar tujuan tersebut.")
      }

      // Validate new room assignment
      const validRoom = await ResidentBusiness.validateRoomAssignment(tx, newRoomId, residentId)

      const newRoomDetail = await tx.room.findUnique({
        where: { id: newRoomId },
        include: { daerah: { include: { wilayah: true } } }
      })

      if (!newRoomDetail) {
        throw BusinessError.invalidReference("Kamar Tujuan")
      }

      const oldRoomId = resident.roomId
      const oldRoomNumber = resident.room?.number || null
      const oldWilayah = resident.wilayah
      const oldDaerah = resident.daerah

      const newWilayah = newRoomDetail.daerah?.wilayah?.name || null
      const newDaerah = newRoomDetail.daerah?.name || null

      // 1. Update resident room
      await tx.resident.update({
        where: { id: residentId },
        data: {
          roomId: validRoom.id,
          wilayah: newWilayah,
          daerah: newDaerah
        }
      })

      // 2. Record room history
      await tx.residentRoomHistory.create({
        data: {
          residentId,
          fromRoomId: oldRoomId,
          fromRoom: oldRoomNumber,
          toRoomId: validRoom.id,
          toRoom: validRoom.number,
          fromWilayah: oldWilayah,
          fromDaerah: oldDaerah,
          toWilayah: newWilayah,
          toDaerah: newDaerah,
          alasan: payload.alasan || null,
          transferedBy: performedBy
        }
      })

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          action: "ROOM_TRANSFER",
          entityType: "RESIDENT",
          entityId: residentId,
          performedBy,
          oldValue: JSON.stringify({ roomId: oldRoomId, room: oldRoomNumber, wilayah: oldWilayah, daerah: oldDaerah }),
          newValue: JSON.stringify({ roomId: validRoom.id, room: validRoom.number, wilayah: newWilayah, daerah: newDaerah, alasan: payload.alasan })
        }
      })

      // 4. Release old room status if needed
      if (oldRoomId) {
        const oldRoom = await tx.room.findUnique({
          where: { id: oldRoomId },
          include: { _count: { select: { residents: true } } }
        })
        if (!oldRoom) {
          throw BusinessError.invalidReference("Kamar Lama")
        }
        if (oldRoom._count.residents <= 1) {
          await tx.room.update({
            where: { id: oldRoomId },
            data: { status: "AVAILABLE" }
          })
        }
      }

      // 5. Update new room status if full
      if (validRoom.residentsCount >= validRoom.capacity) {
        await tx.room.update({
          where: { id: validRoom.id },
          data: { status: "OCCUPIED" }
        })
      }

      return {
        newRoom: { id: validRoom.id, number: validRoom.number },
        newWilayah,
        newDaerah
      }
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")

    return {
      success: true,
      newRoom: result.newRoom,
      newWilayah: result.newWilayah,
      newDaerah: result.newDaerah
    }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Transfer Kamar")
    return { error: businessErr.message }
  }
}

export async function getResidentRoomHistory(residentId: string) {
  try {
    const history = await prisma.residentRoomHistory.findMany({
      where: { residentId },
      orderBy: { createdAt: "desc" }
    })
    return { success: true, history }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Riwayat Kamar")
    return { error: businessErr.message }
  }
}

export async function getAvailableRooms() {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: "AVAILABLE" },
      include: {
        residents: { select: { id: true } },
        daerah: { include: { wilayah: true } }
      },
      orderBy: [{ daerah: { wilayah: { name: "asc" } } }, { number: "asc" }]
    })
    return { success: true, rooms }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Daftar Kamar")
    return { error: businessErr.message }
  }
}
