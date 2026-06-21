"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { KehadiranStatus, ResidentStatus } from "@prisma/client"

export async function getKegiatans() {
  try {
    const kegiatans = await prisma.kegiatan.findMany({
      include: {
        absensi: true
      },
      orderBy: { tanggal: "desc" },
    })
    
    return kegiatans.map(k => {
      const hadirCount = k.absensi.filter(a => a.status === KehadiranStatus.HADIR).length
      const totalCount = k.absensi.length
      return {
        ...k,
        hadirCount,
        totalCount
      }
    })
  } catch (error) {
    console.error("Failed to fetch kegiatans:", error)
    return []
  }
}

export async function getKegiatanDetail(id: string) {
  try {
    return await prisma.kegiatan.findUnique({
      where: { id },
      include: {
        absensi: {
          include: {
            resident: true
          },
          orderBy: {
            resident: { name: "asc" }
          }
        }
      }
    })
  } catch (error) {
    console.error("Failed to fetch kegiatan detail:", error)
    return null
  }
}

export async function createKegiatan(formData: {
  nama: string
  tanggal: Date
  keterangan?: string
}) {
  try {
    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: formData.nama,
        tanggal: formData.tanggal,
        keterangan: formData.keterangan,
      }
    })

    const activeResidents = await prisma.resident.findMany({
      where: { status: ResidentStatus.ACTIVE }
    })

    if (activeResidents.length > 0) {
      await prisma.absensiKegiatan.createMany({
        data: activeResidents.map(r => ({
          kegiatanId: kegiatan.id,
          residentId: r.id,
          status: KehadiranStatus.HADIR
        }))
      })
    }

    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true, kegiatanId: kegiatan.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat kegiatan absensi."
    return { error: message }
  }
}

export async function updateAbsensiKegiatanStatus(
  absensiId: string, 
  status: KehadiranStatus, 
  keterangan: string = ""
) {
  try {
    await prisma.absensiKegiatan.update({
      where: { id: absensiId },
      data: { 
        status, 
        keterangan: keterangan || null 
      }
    })
    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui status kehadiran."
    return { error: message }
  }
}

export async function deleteKegiatan(id: string) {
  try {
    await prisma.kegiatan.delete({
      where: { id },
    })
    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus kegiatan."
    return { error: message }
  }
}

export async function updateKegiatan(
  id: string,
  formData: { nama: string; tanggal: Date; keterangan?: string }
) {
  try {
    await prisma.kegiatan.update({
      where: { id },
      data: {
        nama: formData.nama,
        tanggal: formData.tanggal,
        keterangan: formData.keterangan || null,
      },
    })
    revalidatePath("/dashboard/absensi/kegiatan")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui kegiatan."
    return { error: message }
  }
}

export async function getAllAbsensiDetail() {
  try {
    return await prisma.kegiatan.findMany({
      include: {
        absensi: {
          include: {
            resident: true
          }
        }
      },
      orderBy: { tanggal: "desc" },
    })
  } catch (error) {
    console.error("Failed to fetch all absensi detail:", error)
    return []
  }
}
