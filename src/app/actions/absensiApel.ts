"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { KehadiranApel } from "@prisma/client"

export async function createApel(formData: { tanggal: Date; keterangan?: string }) {
  try {
    const apel = await prisma.apel.create({
      data: {
        tanggal: formData.tanggal,
        keterangan: formData.keterangan || null,
      },
    })

    const activeResidents = await prisma.resident.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    })

    if (activeResidents.length > 0) {
      await prisma.absensiApel.createMany({
        data: activeResidents.map(r => ({
          apelId: apel.id,
          residentId: r.id,
          status: KehadiranApel.HADIR,
        })),
      })
    }

    revalidatePath("/dashboard/absensi/apel")
    return { success: true, apelId: apel.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat absen apel."
    return { error: message }
  }
}

export async function getApels() {
  try {
    const apels = await prisma.apel.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        _count: {
          select: { absensi: true }
        },
        absensi: {
          where: { status: "HADIR" },
          select: { id: true }
        }
      }
    })

    return apels.map(k => ({
      id: k.id,
      tanggal: k.tanggal,
      keterangan: k.keterangan,
      totalCount: k._count.absensi,
      hadirCount: k.absensi.length
    }))
  } catch (error) {
    console.error("Error getApels:", error)
    return []
  }
}

export async function getApelDetail(id: string) {
  try {
    return await prisma.apel.findUnique({
      where: { id },
      include: {
        absensi: {
          include: {
            resident: {
              select: { id: true, name: true }
            }
          },
          orderBy: {
            resident: { name: "asc" }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error getApelDetail:", error)
    return null
  }
}

export async function updateAbsensiApelStatus(absensiId: string, status: KehadiranApel) {
  try {
    await prisma.absensiApel.update({
      where: { id: absensiId },
      data: { status },
    })
    revalidatePath("/dashboard/absensi/apel")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui status absensi."
    return { error: message }
  }
}

export async function deleteApel(id: string) {
  try {
    await prisma.apel.delete({
      where: { id },
    })
    revalidatePath("/dashboard/absensi/apel")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus apel."
    return { error: message }
  }
}

export async function updateApel(
  id: string,
  formData: { tanggal: Date; keterangan?: string }
) {
  try {
    await prisma.apel.update({
      where: { id },
      data: {
        tanggal: formData.tanggal,
        keterangan: formData.keterangan || null,
      },
    })
    revalidatePath("/dashboard/absensi/apel")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui apel."
    return { error: message }
  }
}

export async function getAllAbsensiApelDetail() {
  try {
    return await prisma.apel.findMany({
      orderBy: { tanggal: "desc" },
      include: {
        absensi: {
          include: {
            resident: {
              select: { name: true }
            }
          },
          orderBy: {
            resident: { name: "asc" }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error getAllAbsensiApelDetail:", error)
    return []
  }
}
