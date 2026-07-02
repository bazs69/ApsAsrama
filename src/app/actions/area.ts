"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { RoomStatus, Prisma } from "@prisma/client"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { BusinessError } from "@/lib/business/businessErrors"

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
    logOperationalError({ action: "Failed to fetch area hierarchy:", error: error })
    return []
  }
}

// WILAYAH
export async function createWilayah(name: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const wilayah = await prisma.wilayah.findUnique({
      where: { id },
      include: { daerahs: true }
    })
    
    if (wilayah && wilayah.daerahs.length > 0) {
      return { error: BusinessError.cannotDelete("Wilayah", "Daerah").message }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const daerah = await prisma.daerah.findUnique({
      where: { id },
      include: { rooms: true }
    })
    
    if (daerah && daerah.rooms.length > 0) {
      return { error: BusinessError.cannotDelete("Daerah", "Kamar").message }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
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
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const room = await prisma.room.findUnique({
      where: { id },
      include: { residents: true }
    })
    
    if (room && room.residents.length > 0) {
      return { error: BusinessError.cannotDelete("Kamar", "Santri").message }
    }

    await prisma.room.delete({ where: { id } })
    revalidatePath("/dashboard/area")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus kamar." }
  }
}
