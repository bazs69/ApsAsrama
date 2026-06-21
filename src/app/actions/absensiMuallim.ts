"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { AbsensiStatus } from "@prisma/client"

export async function getAbsensiMuallim() {
  try {
    return await prisma.absensiMuallim.findMany({
      include: {
        muallim: true
      },
      orderBy: { tanggal: "desc" },
    })
  } catch (error) {
    console.error("Failed to fetch absensi muallim:", error)
    return []
  }
}

export async function createAbsensiMuallim(formData: {
  hari: string
  tanggal: Date
  muallimId: string
  status: AbsensiStatus
  keterangan?: string
}) {
  try {
    const absensi = await prisma.absensiMuallim.create({
      data: {
        hari: formData.hari,
        tanggal: formData.tanggal,
        muallimId: formData.muallimId,
        status: formData.status,
        keterangan: formData.keterangan,
      },
      include: {
        muallim: true
      }
    })

    revalidatePath("/dashboard/absensi/muallim")
    return { success: true, absensi }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menambah data absensi muallim."
    return { error: message }
  }
}

export async function deleteAbsensiMuallim(id: string) {
  try {
    await prisma.absensiMuallim.delete({
      where: { id },
    })

    revalidatePath("/dashboard/absensi/muallim")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus data absensi muallim."
    return { error: message }
  }
}
