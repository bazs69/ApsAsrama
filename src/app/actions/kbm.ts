"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { ActivityBusiness } from "@/lib/business/activityBusiness"
import { BusinessError } from "@/lib/business/businessErrors"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export async function getKbms() {
  try {
    const kbms = await prisma.kbm.findMany({
      orderBy: { name: "asc" },
    })
    return kbms
  } catch (error) {
    logOperationalError({ action: "Error fetching KBMs:", error: error })
    return []
  }
}

export async function createKbm(name: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const validName = ActivityBusiness.validateKBMName(name)

    const existing = await prisma.kbm.findUnique({ where: { name: validName } })
    if (existing) {
      throw BusinessError.alreadyExists(`KBM dengan nama ${validName}`)
    }

    const data = await prisma.kbm.create({
      data: { name: validName },
    })
    
    revalidatePath("/dashboard/kbm")
    return { success: true, data }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Tambah KBM")
    return { error: businessErr.message }
  }
}

export async function updateKbm(id: string, name: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    const validName = ActivityBusiness.validateKBMName(name)

    const existing = await prisma.kbm.findFirst({
      where: { name: validName, NOT: { id } },
    })
    if (existing) {
      throw BusinessError.alreadyExists(`KBM dengan nama ${validName}`)
    }

    const data = await prisma.kbm.update({
      where: { id },
      data: { name: validName },
    })
    
    revalidatePath("/dashboard/kbm")
    return { success: true, data }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Perbarui KBM")
    return { error: businessErr.message }
  }
}

export async function deleteKbm(id: string) {
  try {
    if (!await checkCrudRateLimit()) return { error: "Too many requests." }
    await prisma.kbm.delete({
      where: { id },
    })
    
    revalidatePath("/dashboard/kbm")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Hapus KBM")
    return { error: businessErr.message }
  }
}
