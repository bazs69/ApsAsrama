"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getKbms() {
  try {
    const kbms = await prisma.kbm.findMany({
      orderBy: { name: "asc" },
    })
    return kbms
  } catch (error) {
    console.error("Error fetching KBMs:", error)
    return []
  }
}

export async function createKbm(name: string) {
  try {
    const existing = await prisma.kbm.findUnique({ where: { name } })
    if (existing) {
      return { error: "Nama KBM sudah ada." }
    }

    const data = await prisma.kbm.create({
      data: { name },
    })
    
    revalidatePath("/dashboard/kbm")
    return { success: true, data }
  } catch (error) {
    console.error("Error creating KBM:", error)
    return { error: "Gagal menambahkan data." }
  }
}

export async function updateKbm(id: string, name: string) {
  try {
    const existing = await prisma.kbm.findFirst({
      where: { name, NOT: { id } },
    })
    if (existing) {
      return { error: "Nama KBM sudah digunakan." }
    }

    const data = await prisma.kbm.update({
      where: { id },
      data: { name },
    })
    
    revalidatePath("/dashboard/kbm")
    return { success: true, data }
  } catch (error) {
    console.error("Error updating KBM:", error)
    return { error: "Gagal memperbarui data." }
  }
}

export async function deleteKbm(id: string) {
  try {
    await prisma.kbm.delete({
      where: { id },
    })
    
    revalidatePath("/dashboard/kbm")
    return { success: true }
  } catch (error) {
    console.error("Error deleting KBM:", error)
    return { error: "Gagal menghapus data." }
  }
}
