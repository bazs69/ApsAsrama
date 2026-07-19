"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { cache } from "react"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { dispatchNotification } from "@/lib/notifications/notificationDispatcher"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"
import { BusinessError } from "@/lib/business/businessErrors"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

export interface AssignmentFormData {
  residentId?: string // Retained for backward compatibility during transition & update action
  residentIds?: string[] // New array for multiple assignments
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
    logOperationalError({ action: "Failed to fetch assignments:", error: error })
    return []
  }
}

export async function getAssignmentsPaginated(options: { page: number; pageSize: number; search?: string }) {
  try {
    const { page, pageSize, search } = options
    const skip = (page - 1) * pageSize
    const take = pageSize

    const where = search ? {
      OR: [
        { position: { contains: search, mode: "insensitive" as const } },
        { resident: { name: { contains: search, mode: "insensitive" as const } } }
      ]
    } : {}

    const [total, data] = await prisma.$transaction([
      prisma.assignment.count({ where }),
      prisma.assignment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          resident: true,
          satker: true,
        },
      })
    ])

    const totalPages = Math.ceil(total / pageSize)
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  } catch (error) {
    logOperationalError({ action: "Failed to fetch paginated assignments:", error: error })
    return { data: [], pagination: { page: options.page, pageSize: options.pageSize, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }
  }
}

export const getSatkers = cache(async () => {
  try {
    return await prisma.satker.findMany({
      orderBy: { name: "asc" },
      include: {
        assignments: true,
      },
    })
  } catch (error) {
    logOperationalError({ action: "Failed to fetch satkers:", error: error })
    return []
  }
})

export async function createSatker(formData: {
  name: string
  picName: string
  picPhone?: string
}) {
  return secureAction({
    module: "Satker",
    action: "createSatker",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const existing = await prisma.satker.findUnique({
        where: { name: formData.name },
      })

      if (existing) {
        throw BusinessError.alreadyExists(`Satuan Kerja dengan nama ${formData.name}`)
      }

      try {
        const satker = await prisma.satker.create({
          data: {
            name: formData.name,
            picName: formData.picName,
            picPhone: formData.picPhone || null,
          },
        })

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")
        return { satker }
      } catch (err) {
        throw mapPrismaError(err, "Satuan Kerja")
      }
    }
  })
}

export async function updateSatker(
  id: string,
  formData: {
    name: string
    picName: string
    picPhone?: string
  }
) {
  return secureAction({
    module: "Satker",
    action: "updateSatker",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const existing = await prisma.satker.findFirst({
        where: {
          name: formData.name,
          NOT: { id },
        },
      })

      if (existing) {
        throw BusinessError.alreadyExists(`Satuan Kerja dengan nama ${formData.name}`)
      }

      try {
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
        return { satker }
      } catch (err) {
        throw mapPrismaError(err, "Perbarui Satuan Kerja")
      }
    }
  })
}

export async function deleteSatker(id: string) {
  return secureAction({
    module: "Satker",
    action: "deleteSatker",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      try {
        await prisma.satker.delete({
          where: { id },
        })

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")
        return {}
      } catch (err) {
        throw mapPrismaError(err, "Hapus Satuan Kerja")
      }
    }
  })
}

export async function createAssignment(formData: AssignmentFormData) {
  return secureAction({
    module: "Assignment",
    action: "createAssignment",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      // 1. Deduplikasi dan pembersihan residentIds
      const rawIds = formData.residentIds || (formData.residentId ? [formData.residentId] : [])
      const uniqueIds = Array.from(new Set(rawIds.filter(id => id && id.trim() !== "")))

      if (uniqueIds.length === 0) {
        throw BusinessError.validation("Silakan pilih minimal satu santri.")
      }

      // 3. Generate groupId (batch ID)
      const groupId = crypto.randomUUID()

      // 4. Proses Insert menggunakan Interactive Transaction Callback agar fully Atomic.
      // [AS-04 FIX] & [5B.4] Ganti array-of-promises menjadi interactive callback transaction.
      // Jika satu create gagal, seluruh batch dibatalkan — menghindari partial insert.
      // Pindahkan validasi ke dalam transaction untuk mencegah race condition / duplicate.
      try {
        const createdAssignments = await prisma.$transaction(async (tx) => {
          // [AS-02 FIX] Validate that all selected residents are still ACTIVE.
          const inactiveResidents = await tx.resident.findMany({
            where: {
              id: { in: uniqueIds },
              status: { not: "ACTIVE" }
            },
            select: { name: true, status: true }
          })
          if (inactiveResidents.length > 0) {
            const names = inactiveResidents.map(r => `${r.name} (${r.status})`).join(", ")
            throw BusinessError.validation(`Santri berikut tidak dapat ditugaskan karena statusnya tidak aktif: ${names}.`)
          }

          // [5B.5] Cek apakah ada santri yang masih memiliki status ACTIVE di Satker MANA PUN (GLOBAL)
          const existingActive = await tx.assignment.findFirst({
            where: {
              residentId: { in: uniqueIds },
              status: "ACTIVE"
            },
            include: { resident: true, satker: true }
          })

          if (existingActive) {
            throw BusinessError.conflict(`Santri ${existingActive.resident.name} sudah terdaftar aktif di Satuan Kerja ${existingActive.satker.name}. Satu santri hanya boleh memiliki maksimal 1 penugasan aktif.`)
          }

          // Verifikasi satker exists
          const satkerExists = await tx.satker.findUnique({
            where: { id: formData.satkerId }
          })
          if (!satkerExists) {
            throw BusinessError.invalidReference("Satuan Kerja")
          }

          const results = []
          for (const rId of uniqueIds) {
            const created = await tx.assignment.create({
              data: {
                residentId: rId,
                satkerId: formData.satkerId,
                groupId: groupId,
                position: formData.position || "Anggota",
                status: formData.status || "ACTIVE",
                startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
                endDate: formData.endDate ? new Date(formData.endDate) : null,
              }
            })
            results.push(created)
          }
          return results
        })

        // 6. Notification (Fail-open)
        await dispatchNotification({
          userId: context.currentUserId,
          title: "Penugasan Santri Berhasil",
          message: `${createdAssignments.length} santri berhasil ditugaskan ke Satuan Kerja (Group ID: ${groupId}).`,
          type: "SUCCESS",
          metadata: { groupId, totalCreated: createdAssignments.length },
        }).catch(e => logOperationalError({ action: "Notification failed:", error: e }))

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")
        
        return { assignment: createdAssignments[0], total: createdAssignments.length }
      } catch (err) {
        throw mapPrismaError(err, "Buat Penugasan")
      }
    }
  })
}

export async function updateAssignment(
  id: string,
  formData: AssignmentFormData
) {
  return secureAction({
    module: "Assignment",
    action: "updateAssignment",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      // [5B.3] Assignment Workflow State Integrity Guard
      const current = await prisma.assignment.findUnique({
        where: { id },
        select: { status: true }
      })
      if (!current) throw BusinessError.invalidReference("Penugasan")
      if (current.status === "TRANSFERRED") {
        throw BusinessError.validation("Penugasan yang sudah ditransfer (historis) tidak dapat diubah kembali.")
      }

      try {
        const assignment = await prisma.assignment.update({
          where: { id },
          data: {
            residentId: formData.residentId || (formData.residentIds ? formData.residentIds[0] : undefined),
            satkerId: formData.satkerId,
            position: formData.position || "Anggota",
            status: formData.status || "ACTIVE",
            startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
            endDate: formData.endDate ? new Date(formData.endDate) : null,
          },
        })

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")
        return { assignment }
      } catch (err) {
        throw mapPrismaError(err, "Perbarui Penugasan")
      }
    }
  })
}

export async function deleteAssignment(id: string) {
  return secureAction({
    module: "Assignment",
    action: "deleteAssignment",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      // [AS-03 FIX] Reject deletion of ACTIVE assignments to preserve audit trail.
      // Active assignments must be transferred first, not hard-deleted.
      const assignment = await prisma.assignment.findUnique({
        where: { id },
        select: { id: true, status: true }
      })
      if (!assignment) {
        throw BusinessError.invalidReference("Penugasan")
      }
      if (assignment.status === "ACTIVE") {
        throw BusinessError.validation(
          "Penugasan yang masih aktif tidak dapat dihapus. Lakukan transfer terlebih dahulu sebelum penghapusan."
        )
      }
      // [5B.3] Protect TRANSFERRED assignment from hard deletion
      if (assignment.status === "TRANSFERRED") {
        throw BusinessError.cannotDelete("Penugasan Historis (TRANSFERRED)", "Audit Trail")
      }

      try {
        await prisma.assignment.delete({
          where: { id },
        })

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")
        return {}
      } catch (err) {
        throw mapPrismaError(err, "Hapus Penugasan")
      }
    }
  })
}

export async function transferAssignment(data: {
  assignmentId: string
  newSatkerId: string
  transferReason: string
}) {
  return secureAction({
    module: "Assignment",
    action: "transferAssignment",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const oldAssignment = await prisma.assignment.findUnique({
        where: { id: data.assignmentId },
        include: { resident: true }
      })

      if (!oldAssignment) {
        throw BusinessError.invalidReference("Assignment")
      }

      if (oldAssignment.status !== "ACTIVE") {
        throw BusinessError.validation("Hanya penugasan yang aktif yang dapat ditransfer.")
      }

      if (oldAssignment.satkerId === data.newSatkerId) {
        throw BusinessError.validation("Santri sudah berada di Satuan Kerja tersebut.")
      }

      const newSatker = await prisma.satker.findUnique({
        where: { id: data.newSatkerId }
      })

      if (!newSatker) {
        throw BusinessError.invalidReference("Satuan Kerja tujuan")
      }

      const otherActive = await prisma.assignment.findFirst({
        where: {
          residentId: oldAssignment.residentId,
          status: "ACTIVE",
          id: { not: oldAssignment.id }
        }
      })

      if (otherActive) {
        throw BusinessError.conflict("Santri masih memiliki penugasan aktif lain. Perpindahan ditolak untuk menghindari duplikasi status aktif.")
      }

      try {
        const transactionResult = await prisma.$transaction(async (tx) => {
          const { count } = await tx.assignment.updateMany({
            where: { id: oldAssignment.id, status: "ACTIVE" },
            data: {
              status: "TRANSFERRED",
              endDate: new Date(),
              transferReason: data.transferReason,
              transferredAt: new Date()
            }
          })

          if (count === 0) {
            throw BusinessError.conflict("Penugasan sudah tidak aktif atau sedang diproses oleh permintaan lain.")
          }

          const updatedOld = await tx.assignment.findUnique({ where: { id: oldAssignment.id } })

          const newAssignment = await tx.assignment.create({
            data: {
              residentId: oldAssignment.residentId,
              satkerId: data.newSatkerId,
              position: oldAssignment.position,
              status: "ACTIVE",
              startDate: new Date(),
              transferredFromId: oldAssignment.id,
            }
          })

          return { updatedOld, newAssignment }
        })

        await dispatchNotification({
          userId: context.currentUserId,
          title: "Transfer Penugasan Berhasil",
          message: "Penugasan berhasil dipindahkan ke Satuan Kerja baru.",
          type: "SUCCESS",
          metadata: { residentId: oldAssignment.residentId, toSatkerId: data.newSatkerId },
        }).catch(e => logOperationalError({ action: "Notification failed:", error: e }))

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")

        return { newAssignment: transactionResult.newAssignment }
      } catch (err) {
        throw mapPrismaError(err, "Transfer Penugasan")
      }
    }
  })
}

export interface BulkImportData {
  nim: string
  satkerName: string
  position?: string
  startDate?: string
}

export async function bulkImportAssignments(data: BulkImportData[]) {
  return secureAction({
    module: "Assignment",
    action: "createAssignment",
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const results = {
        success: 0,
        failed: [] as { row: number; nim: string; reason: string }[],
      }

      if (data.length === 0) {
        throw BusinessError.validation("File import kosong.")
      }

      const groupId = crypto.randomUUID()

      const nims = data.map(d => String(d.nim).trim()).filter(Boolean)
      const residents = await prisma.resident.findMany({
        where: { nim: { in: nims } }
      })
      const residentMap = new Map(residents.map(r => [r.nim, r]))

      const satkerNames = data.map(d => String(d.satkerName).trim()).filter(Boolean)
      const satkers = await prisma.satker.findMany({
        where: { name: { in: satkerNames } }
      })
      const satkerMap = new Map(satkers.map(s => [s.name.toLowerCase(), s]))

      const activeAssignments = await prisma.assignment.findMany({
        where: {
          residentId: { in: residents.map(r => r.id) },
          status: "ACTIVE"
        },
        include: { satker: true }
      })
      const activeMap = new Map(activeAssignments.map(a => [a.residentId, a]))

      const validAssignments: any[] = []

      // Assuming Excel rows start at 2 (1 for header)
      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const nim = String(row.nim).trim()
        const satkerName = String(row.satkerName).trim()

        if (!nim || !satkerName) {
          results.failed.push({ row: i + 2, nim: nim || "-", reason: "NIM atau Nama Satker kosong" })
          continue
        }

        const resident = residentMap.get(nim)
        if (!resident) {
          results.failed.push({ row: i + 2, nim, reason: "NIM tidak ditemukan" })
          continue
        }

        if (resident.status !== "ACTIVE") {
          results.failed.push({ row: i + 2, nim, reason: "Status santri tidak aktif" })
          continue
        }

        const active = activeMap.get(resident.id)
        if (active) {
          results.failed.push({ row: i + 2, nim, reason: `Santri sudah aktif di Satker ${active.satker.name}` })
          continue
        }

        const satker = satkerMap.get(satkerName.toLowerCase())
        if (!satker) {
          results.failed.push({ row: i + 2, nim, reason: `Satker "${satkerName}" tidak ditemukan` })
          continue
        }

        validAssignments.push({
          residentId: resident.id,
          satkerId: satker.id,
          groupId: groupId,
          position: row.position || "Anggota",
          status: "ACTIVE",
          startDate: row.startDate ? new Date(row.startDate) : new Date(),
        })
      }

      if (validAssignments.length === 0) {
        return { 
          message: "Tidak ada baris yang valid untuk diimpor.", 
          results 
        }
      }

      try {
        await prisma.$transaction(async (tx) => {
          for (const item of validAssignments) {
            await tx.assignment.create({ data: item })
          }
        })

        results.success = validAssignments.length

        await dispatchNotification({
          userId: context.currentUserId,
          title: "Impor Penugasan Santri Berhasil",
          message: `${results.success} santri berhasil ditugaskan ke Satuan Kerja secara massal.`,
          type: "SUCCESS",
          metadata: { groupId, totalImported: results.success },
        }).catch(e => logOperationalError({ action: "Notification failed:", error: e }))

        revalidatePath("/dashboard/assignments")
        revalidatePath("/dashboard/assignments/satkers")

        return { message: "Berhasil diimpor.", results }
      } catch (err) {
        throw mapPrismaError(err, "Impor Penugasan")
      }
    }
  })
}
