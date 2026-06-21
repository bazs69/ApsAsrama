"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { MuallimStatus } from "@prisma/client"

export async function getMuallims() {
  try {
    return await prisma.muallim.findMany({
      orderBy: { name: "asc" },
    })
  } catch (error) {
    console.error("Failed to fetch muallims:", error)
    return []
  }
}

export async function createMuallim(formData: {
  name: string
  kbm: string
  status?: MuallimStatus
}) {
  try {
    const muallim = await prisma.muallim.create({
      data: {
        name: formData.name,
        kbm: formData.kbm,
        status: formData.status || MuallimStatus.ACTIVE,
      },
    })

    revalidatePath("/dashboard/muallim")
    return { success: true, muallim }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah data Muallim."
    return { error: message }
  }
}

export async function updateMuallim(
  id: string,
  formData: {
    name: string
    kbm: string
    status: MuallimStatus
  }
) {
  try {
    const muallim = await prisma.muallim.update({
      where: { id },
      data: {
        name: formData.name,
        kbm: formData.kbm,
        status: formData.status,
      },
    })

    revalidatePath("/dashboard/muallim")
    return { success: true, muallim }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui data Muallim."
    return { error: message }
  }
}

export async function deleteMuallim(id: string) {
  try {
    await prisma.muallim.delete({
      where: { id },
    })

    revalidatePath("/dashboard/muallim")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus data Muallim."
    return { error: message }
  }
}
