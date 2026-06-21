"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { RoomStatus } from "@prisma/client"

export async function getRooms() {
  try {
    return await prisma.room.findMany({
      orderBy: { number: "asc" },
      include: {
        residents: true
      }
    })
  } catch (error) {
    console.error("Failed to fetch rooms:", error)
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
    const existing = await prisma.room.findFirst({
      where: { number: formData.number }
    })

    if (existing) {
      return { error: "Room number already exists." }
    }

    const room = await prisma.room.create({
      data: {
        number: formData.number,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
        status: formData.status
      }
    })

    revalidatePath("/dashboard/rooms")
    return { success: true, room }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create room."
    return { error: message }
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
    const existing = await prisma.room.findFirst({
      where: {
        number: formData.number,
        NOT: { id }
      }
    })

    if (existing) {
      return { error: "Room number is already in use by another room." }
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        number: formData.number,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
        status: formData.status
      }
    })

    revalidatePath("/dashboard/rooms")
    return { success: true, room }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update room."
    return { error: message }
  }
}

export async function deleteRoom(id: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { residents: true }
    })

    if (!room) {
      return { error: "Room not found." }
    }

    if (room.residents.length > 0) {
      return { error: "Cannot delete room. There are residents currently assigned to this room." }
    }

    await prisma.room.delete({
      where: { id }
    })

    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete room."
    return { error: message }
  }
}
