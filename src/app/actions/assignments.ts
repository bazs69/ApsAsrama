"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface AssignmentFormData {
  residentId: string
  satkerId: string
  position?: string
  status?: string
  startDate?: string
  endDate?: string
}

export async function getAssignments() {
  try {
    return await prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        resident: true,
        satker: true,
      },
    })
  } catch (error) {
    console.error("Failed to fetch assignments:", error)
    return []
  }
}

export async function getSatkers() {
  try {
    return await prisma.satker.findMany({
      orderBy: { name: "asc" },
      include: {
        assignments: true,
      },
    })
  } catch (error) {
    console.error("Failed to fetch satkers:", error)
    return []
  }
}

export async function createSatker(formData: {
  name: string
  picName: string
  picPhone?: string
}) {
  try {
    const existing = await prisma.satker.findUnique({
      where: { name: formData.name },
    })

    if (existing) {
      return { error: "Satuan Kerja dengan nama ini sudah terdaftar." }
    }

    const satker = await prisma.satker.create({
      data: {
        name: formData.name,
        picName: formData.picName,
        picPhone: formData.picPhone || null,
      },
    })

    revalidatePath("/dashboard/assignments")
    revalidatePath("/dashboard/assignments/satkers")
    return { success: true, satker }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat Satuan Kerja."
    return { error: message }
  }
}

export async function updateSatker(
  id: string,
  formData: {
    name: string
    picName: string
    picPhone?: string
  }
) {
  try {
    const existing = await prisma.satker.findFirst({
      where: {
        name: formData.name,
        NOT: { id },
      },
    })

    if (existing) {
      return { error: "Satuan Kerja dengan nama ini sudah terdaftar." }
    }

    const satker = await prisma.satker.update({
      where: { id },
      data: {
        name: formData.name,
        picName: formData.picName,
        picPhone: formData.picPhone || null,
      },
    })

    revalidatePath("/dashboard/assignments")
    revalidatePath("/dashboard/assignments/satkers")
    return { success: true, satker }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui Satuan Kerja."
    return { error: message }
  }
}

export async function deleteSatker(id: string) {
  try {
    await prisma.satker.delete({
      where: { id },
    })

    revalidatePath("/dashboard/assignments")
    revalidatePath("/dashboard/assignments/satkers")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus Satuan Kerja."
    return { error: message }
  }
}

export async function createAssignment(formData: AssignmentFormData) {
  try {
    const existing = await prisma.assignment.findUnique({
      where: {
        residentId_satkerId: {
          residentId: formData.residentId,
          satkerId: formData.satkerId,
        },
      },
    })

    if (existing && existing.status === "ACTIVE") {
      return { error: "Santri tersebut sudah terdaftar aktif di Satuan Kerja ini." }
    }

    const assignment = await prisma.assignment.upsert({
      where: {
        residentId_satkerId: {
          residentId: formData.residentId,
          satkerId: formData.satkerId,
        },
      },
      update: {
        position: formData.position || "Anggota",
        status: formData.status || "ACTIVE",
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      },
      create: {
        residentId: formData.residentId,
        satkerId: formData.satkerId,
        position: formData.position || "Anggota",
        status: formData.status || "ACTIVE",
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      },
    })

    revalidatePath("/dashboard/assignments")
    revalidatePath("/dashboard/assignments/satkers")
    return { success: true, assignment }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat penugasan santri."
    return { error: message }
  }
}

export async function updateAssignment(
  id: string,
  formData: AssignmentFormData
) {
  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        residentId: formData.residentId,
        satkerId: formData.satkerId,
        position: formData.position || "Anggota",
        status: formData.status || "ACTIVE",
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      },
    })

    revalidatePath("/dashboard/assignments")
    revalidatePath("/dashboard/assignments/satkers")
    return { success: true, assignment }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui penugasan."
    return { error: message }
  }
}

export async function deleteAssignment(id: string) {
  try {
    await prisma.assignment.delete({
      where: { id },
    })

    revalidatePath("/dashboard/assignments")
    revalidatePath("/dashboard/assignments/satkers")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus penugasan."
    return { error: message }
  }
}
