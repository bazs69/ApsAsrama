"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { RoomStatus, Prisma } from "@prisma/client"

export async function getAreaHierarchy() {
  try {
    return await prisma.wilayah.findMany({
      orderBy: { name: "asc" },
      include: {
        daerahs: {
          orderBy: { name: "asc" },
          include: {
            rooms: {
              orderBy: { number: "asc" },
              include: {
                residents: { select: { id: true } }
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Failed to fetch area hierarchy:", error)
    return []
  }
}

// WILAYAH
export async function createWilayah(name: string) {
  try {
    const data = await prisma.wilayah.create({ data: { name } })
    revalidatePath("/dashboard/area")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Wilayah sudah ada." }
    return { error: "Gagal menambahkan wilayah." }
  }
}

export async function updateWilayah(id: string, name: string) {
  try {
    const data = await prisma.wilayah.update({ where: { id }, data: { name } })
    revalidatePath("/dashboard/area")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Wilayah sudah ada." }
    return { error: "Gagal mengubah wilayah." }
  }
}

export async function deleteWilayah(id: string) {
  try {
    const wilayah = await prisma.wilayah.findUnique({
      where: { id },
      include: { daerahs: true }
    })
    
    if (wilayah?.daerahs.length) {
      return { error: "Gagal menghapus wilayah. Hapus semua daerah di dalamnya terlebih dahulu." }
    }

    await prisma.wilayah.delete({ where: { id } })
    revalidatePath("/dashboard/area")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus wilayah." }
  }
}

// DAERAH
export async function createDaerah(name: string, wilayahId: string) {
  try {
    const data = await prisma.daerah.create({ data: { name, wilayahId } })
    revalidatePath("/dashboard/area")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Daerah sudah ada." }
    return { error: "Gagal menambahkan daerah." }
  }
}

export async function updateDaerah(id: string, name: string, wilayahId: string) {
  try {
    const data = await prisma.daerah.update({ where: { id }, data: { name, wilayahId } })
    revalidatePath("/dashboard/area")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Daerah sudah ada." }
    return { error: "Gagal mengubah daerah." }
  }
}

export async function deleteDaerah(id: string) {
  try {
    const daerah = await prisma.daerah.findUnique({
      where: { id },
      include: { rooms: true }
    })
    
    if (daerah?.rooms.length) {
      return { error: "Gagal menghapus daerah. Hapus semua kamar di dalamnya terlebih dahulu." }
    }

    await prisma.daerah.delete({ where: { id } })
    revalidatePath("/dashboard/area")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus daerah." }
  }
}

// ROOM
export async function createAreaRoom(data: { number: string; capacity: number; floor: number; status: RoomStatus; daerahId: string }) {
  try {
    const existing = await prisma.room.findFirst({ where: { number: data.number, daerahId: data.daerahId } })
    if (existing) return { error: "Nomor kamar sudah ada di daerah ini." }

    const room = await prisma.room.create({ data })
    revalidatePath("/dashboard/area")
    return { success: true, data: room }
  } catch {
    return { error: "Gagal menambahkan kamar." }
  }
}

export async function updateAreaRoom(id: string, data: { number: string; capacity: number; floor: number; status: RoomStatus; daerahId: string }) {
  try {
    const existing = await prisma.room.findFirst({ where: { number: data.number, daerahId: data.daerahId, NOT: { id } } })
    if (existing) return { error: "Nomor kamar sudah dipakai oleh kamar lain di daerah ini." }

    const room = await prisma.room.update({ where: { id }, data })
    revalidatePath("/dashboard/area")
    return { success: true, data: room }
  } catch {
    return { error: "Gagal mengubah kamar." }
  }
}

export async function deleteAreaRoom(id: string) {
  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: { residents: true }
    })
    
    if (room?.residents.length) {
      return { error: "Gagal menghapus kamar. Kamar ini sedang dihuni oleh santri." }
    }

    await prisma.room.delete({ where: { id } })
    revalidatePath("/dashboard/area")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus kamar." }
  }
}
