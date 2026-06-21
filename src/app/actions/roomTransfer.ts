"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export interface RoomTransferPayload {
  residentId: string
  newRoomId: string
  alasan?: string
}

export async function transferResidentRoom(payload: RoomTransferPayload) {
  try {
    const session = await getServerSession(authOptions)
    const performedBy = session?.user?.email || "System"

    const resident = await prisma.resident.findUnique({
      where: { id: payload.residentId },
      include: { room: true }
    })

    if (!resident) {
      return { error: "Santri tidak ditemukan." }
    }

    const newRoom = await prisma.room.findUnique({
      where: { id: payload.newRoomId },
      include: {
        residents: true,
        daerah: { include: { wilayah: true } }
      }
    })

    if (!newRoom) {
      return { error: "Kamar tujuan tidak ditemukan." }
    }

    if (newRoom.residents.length >= newRoom.capacity) {
      return { error: `Kamar ${newRoom.number} sudah penuh (kapasitas: ${newRoom.capacity}).` }
    }

    if (newRoom.id === resident.roomId) {
      return { error: "Santri sudah berada di kamar ini." }
    }

    const oldRoomId = resident.roomId
    const oldRoomNumber = resident.room?.number || null
    const oldWilayah = resident.wilayah
    const oldDaerah = resident.daerah

    const newWilayah = newRoom.daerah?.wilayah?.name || null
    const newDaerah = newRoom.daerah?.name || null

    await prisma.$transaction(async (tx) => {
      // 1. Update resident room
      await tx.resident.update({
        where: { id: payload.residentId },
        data: {
          roomId: newRoom.id,
          wilayah: newWilayah,
          daerah: newDaerah
        }
      })

      // 2. Record room history
      await tx.residentRoomHistory.create({
        data: {
          residentId: payload.residentId,
          fromRoomId: oldRoomId,
          fromRoom: oldRoomNumber,
          toRoomId: newRoom.id,
          toRoom: newRoom.number,
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
          entityId: payload.residentId,
          performedBy,
          oldValue: JSON.stringify({ roomId: oldRoomId, room: oldRoomNumber, wilayah: oldWilayah, daerah: oldDaerah }),
          newValue: JSON.stringify({ roomId: newRoom.id, room: newRoom.number, wilayah: newWilayah, daerah: newDaerah, alasan: payload.alasan })
        }
      })

      // 4. Release old room if needed
      if (oldRoomId) {
        const oldRoom = await tx.room.findUnique({
          where: { id: oldRoomId },
          include: { residents: true }
        })
        if (oldRoom && oldRoom.residents.length <= 1) {
          await tx.room.update({
            where: { id: oldRoomId },
            data: { status: "AVAILABLE" }
          })
        }
      }
    })

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")

    return {
      success: true,
      newRoom: { id: newRoom.id, number: newRoom.number },
      newWilayah,
      newDaerah
    }
  } catch (error) {
    console.error("Room transfer error:", error)
    const message = error instanceof Error ? error.message : "Gagal memindahkan kamar santri."
    return { error: message }
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
    const message = error instanceof Error ? error.message : "Gagal mengambil riwayat kamar."
    return { error: message }
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
    const message = error instanceof Error ? error.message : "Gagal mengambil daftar kamar."
    return { error: message }
  }
}
