"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { PERMISSIONS } from "@/lib/security/permissions"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"

export async function getMonitorings() {
  return secureAction({
    module: "Monitoring",
    action: "getMonitorings",
    executor: async (context) => {
      const monitorings = await prisma.monitoringPenugasan.findMany({
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
      return { monitorings }
    }
  })
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
  return secureAction({
    module: "Monitoring",
    action: "createMonitoring",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

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
      return { monitoring }
    }
  })
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
  return secureAction({
    module: "Monitoring",
    action: "updateMonitoring",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

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
      return { monitoring }
    }
  })
}

export async function deleteMonitoring(id: string) {
  return secureAction({
    module: "Monitoring",
    action: "deleteMonitoring",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      await prisma.monitoringPenugasan.delete({
        where: { id },
      })

      revalidatePath("/dashboard/monitoring-penugasan")
      revalidatePath("/dashboard/laporan")
      return {}
    }
  })
}

export async function getMonitoringStats() {
  return secureAction({
    module: "Monitoring",
    action: "getMonitoringStats",
    executor: async (context) => {
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
    }
  })
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
  return secureAction({
    module: "Monitoring",
    action: "saveBulkMonitoring",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

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
      return {}
    }
  })
}

export async function getLaporanBulanan(satkerId: string, bulan: number, tahun: number) {
  return secureAction({
    module: "Monitoring",
    action: "getLaporanBulanan",
    executor: async (context) => {
      const data = await prisma.laporanBulananSatker.findUnique({
        where: {
          satkerId_bulan_tahun: {
            satkerId,
            bulan,
            tahun,
          }
        }
      })
      return { laporanBulanan: data }
    }
  })
}

export async function getMonthlyData(satkerId: string, bulan: number, tahun: number) {
  return secureAction({
    module: "Monitoring",
    action: "getMonthlyData",
    executor: async (context) => {
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
    }
  })
}


