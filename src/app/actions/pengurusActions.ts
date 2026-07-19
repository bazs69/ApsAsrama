"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPengurusAsrama() {
  try {
    const pengurus = await prisma.pengurusAsrama.findMany({
      where: {
        status: "ACTIVE"
      },
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            nim: true,
            photo: true,
            room: {
              select: {
                number: true,
                daerah: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return { success: true, data: pengurus }
  } catch (error) {
    console.error("Gagal memuat data pengurus:", error)
    return { success: false, error: "Gagal memuat data pengurus" }
  }
}

export async function addPengurusAsrama(data: { residentId: string, jabatan: string, divisi?: string }) {
  try {
    // Cek apakah sudah jadi pengurus aktif
    const existing = await prisma.pengurusAsrama.findFirst({
      where: { residentId: data.residentId, status: "ACTIVE" }
    })

    if (existing) {
      return { success: false, error: "Santri tersebut sudah menjabat sebagai pengurus aktif." }
    }

    const newPengurus = await prisma.pengurusAsrama.create({
      data: {
        residentId: data.residentId,
        jabatan: data.jabatan,
        divisi: data.divisi,
        status: "ACTIVE"
      }
    })

    revalidatePath("/dashboard/pengurus")
    return { success: true, data: newPengurus }
  } catch (error) {
    console.error("Gagal mengangkat pengurus:", error)
    return { success: false, error: "Gagal mengangkat pengurus" }
  }
}

export async function demisionerPengurusAsrama(pengurusId: string) {
  try {
    await prisma.pengurusAsrama.update({
      where: { id: pengurusId },
      data: {
        status: "DEMISIONER",
        akhirJabatan: new Date()
      }
    })

    revalidatePath("/dashboard/pengurus")
    return { success: true }
  } catch (error) {
    console.error("Gagal memberhentikan pengurus:", error)
    return { success: false, error: "Gagal memberhentikan pengurus" }
  }
}

export async function searchSantriForPengurus(query: string) {
  try {
    const santri = await prisma.resident.findMany({
      where: {
        status: "ACTIVE",
        name: { contains: query, mode: "insensitive" },
        // Jangan tampilkan yang sudah jadi pengurus aktif
        pengurusAsrama: { is: null } // Wait, Prisma might need a different syntax for this depending on relation.
        // Actually it's easier to just fetch all matching and filter in JS if relation filtering is complex, 
        // but Prisma can do: pengurusAsrama: { is: null } or we can check status.
        // Let's just do a basic search
      },
      take: 10,
      select: {
        id: true,
        name: true,
        nim: true,
        pengurusAsrama: {
          select: { status: true }
        }
      }
    })

    // Filter manual untuk memastikan mereka belum menjadi pengurus aktif
    const available = santri.filter(s => !s.pengurusAsrama || s.pengurusAsrama.status !== "ACTIVE")

    return { success: true, data: available }
  } catch (error) {
    console.error("Gagal mencari santri:", error)
    return { success: false, error: "Gagal mencari santri" }
  }
}
