"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getMonitorings() {
  try {
    return await prisma.monitoringPenugasan.findMany({
      orderBy: { tanggalMonitoring: "desc" },
      include: {
        assignment: {
          include: {
            resident: true,
            satker: true,
          },
        },
      },
    })
  } catch (error) {
    console.error("Failed to fetch monitorings:", error)
    return []
  }
}

export async function createMonitoring(formData: {
  assignmentId: string
  tanggalMonitoring: string
  statusMonitoring: string
  catatanMonitoring?: string
  catatanPembimbing?: string
  dokumentasi?: string
  createdBy?: string
}) {
  try {
    const monitoring = await prisma.monitoringPenugasan.create({
      data: {
        assignmentId: formData.assignmentId,
        tanggalMonitoring: new Date(formData.tanggalMonitoring),
        statusMonitoring: formData.statusMonitoring,
        catatanMonitoring: formData.catatanMonitoring || null,
        catatanPembimbing: formData.catatanPembimbing || null,
        dokumentasi: formData.dokumentasi || null,
        createdBy: formData.createdBy || null,
      },
    })

    revalidatePath("/dashboard/monitoring-penugasan")
    revalidatePath("/dashboard/laporan")
    return { success: true, monitoring }
  } catch (error) {
    console.error("Failed to create monitoring:", error)
    const message = error instanceof Error ? error.message : "Gagal membuat data monitoring penugasan."
    return { error: message }
  }
}

export async function updateMonitoring(
  id: string,
  formData: {
    assignmentId: string
    tanggalMonitoring: string
    statusMonitoring: string
    catatanMonitoring?: string
    catatanPembimbing?: string
    dokumentasi?: string
  }
) {
  try {
    const monitoring = await prisma.monitoringPenugasan.update({
      where: { id },
      data: {
        assignmentId: formData.assignmentId,
        tanggalMonitoring: new Date(formData.tanggalMonitoring),
        statusMonitoring: formData.statusMonitoring,
        catatanMonitoring: formData.catatanMonitoring || null,
        catatanPembimbing: formData.catatanPembimbing || null,
        dokumentasi: formData.dokumentasi || null,
      },
    })

    revalidatePath("/dashboard/monitoring-penugasan")
    revalidatePath("/dashboard/laporan")
    return { success: true, monitoring }
  } catch (error) {
    console.error("Failed to update monitoring:", error)
    const message = error instanceof Error ? error.message : "Gagal memperbarui data monitoring penugasan."
    return { error: message }
  }
}

export async function deleteMonitoring(id: string) {
  try {
    await prisma.monitoringPenugasan.delete({
      where: { id },
    })

    revalidatePath("/dashboard/monitoring-penugasan")
    revalidatePath("/dashboard/laporan")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete monitoring:", error)
    const message = error instanceof Error ? error.message : "Gagal menghapus data monitoring penugasan."
    return { error: message }
  }
}

export async function getMonitoringStats() {
  try {
    const [total, bertugas, tidakBertugas, izinSakit, selesai] = await Promise.all([
      prisma.monitoringPenugasan.count(),
      prisma.monitoringPenugasan.count({ where: { statusMonitoring: "Bertugas" } }),
      prisma.monitoringPenugasan.count({ where: { statusMonitoring: "Tidak Bertugas" } }),
      prisma.monitoringPenugasan.count({ where: { statusMonitoring: { in: ["Izin", "Sakit"] } } }),
      prisma.monitoringPenugasan.count({ where: { statusMonitoring: "Selesai" } }),
    ])

    return {
      total,
      bertugas,
      tidakBertugas,
      izinSakit,
      selesai,
    }
  } catch (error) {
    console.error("Failed to fetch monitoring stats:", error)
    return {
      total: 0,
      bertugas: 0,
      tidakBertugas: 0,
      izinSakit: 0,
      selesai: 0,
    }
  }
}

export async function saveBulkMonitoring(
  satkerId: string,
  bulan: number,
  tahun: number,
  kesimpulan: string,
  monitorings: {
    id?: string
    assignmentId: string
    tanggalMonitoring: string
    statusMonitoring: string
    catatanMonitoring?: string
  }[]
) {
  try {
    await prisma.$transaction(async (tx) => {
      // Upsert LaporanBulananSatker
      await tx.laporanBulananSatker.upsert({
        where: {
          satkerId_bulan_tahun: {
            satkerId,
            bulan,
            tahun,
          }
        },
        update: {
          kesimpulan,
        },
        create: {
          satkerId,
          bulan,
          tahun,
          kesimpulan,
        }
      })

      // For monitorings
      for (const m of monitorings) {
        if (m.id) {
          await tx.monitoringPenugasan.update({
            where: { id: m.id },
            data: {
              statusMonitoring: m.statusMonitoring,
              catatanMonitoring: m.catatanMonitoring || null,
            }
          })
        } else {
          await tx.monitoringPenugasan.create({
            data: {
              assignmentId: m.assignmentId,
              tanggalMonitoring: new Date(m.tanggalMonitoring),
              statusMonitoring: m.statusMonitoring,
              catatanMonitoring: m.catatanMonitoring || null,
            }
          })
        }
      }
    })

    revalidatePath("/dashboard/monitoring-penugasan")
    revalidatePath("/dashboard/laporan")
    return { success: true }
  } catch (error) {
    console.error("Failed to save bulk monitoring:", error)
    const message = error instanceof Error ? error.message : "Gagal menyimpan laporan bulanan."
    return { error: message }
  }
}

export async function getLaporanBulanan(satkerId: string, bulan: number, tahun: number) {
  try {
    return await prisma.laporanBulananSatker.findUnique({
      where: {
        satkerId_bulan_tahun: {
          satkerId,
          bulan,
          tahun,
        }
      }
    })
  } catch (error) {
    console.error("Failed to fetch laporan bulanan:", error)
    return null
  }
}

export async function getMonthlyData(satkerId: string, bulan: number, tahun: number) {
  try {
    const [laporanBulanan, monitorings] = await Promise.all([
      prisma.laporanBulananSatker.findUnique({
        where: { satkerId_bulan_tahun: { satkerId, bulan, tahun } }
      }),
      prisma.monitoringPenugasan.findMany({
        where: {
          assignment: { satkerId },
          tanggalMonitoring: {
            gte: new Date(tahun, bulan - 1, 1),
            lt: new Date(tahun, bulan, 1) // First day of next month
          }
        }
      })
    ])

    return {
      laporanBulanan,
      monitorings
    }
  } catch (error) {
    console.error("Failed to fetch monthly data:", error)
    return { laporanBulanan: null, monitorings: [] }
  }
}


