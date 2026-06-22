"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ResidentStatus, RoomStatus, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function getResidents() {
  try {
    return await prisma.resident.findMany({
      orderBy: { name: "asc" },
      include: {
        room: true,
        assignments: {
          include: {
            satker: true
          }
        }
      }
    })
  } catch (error) {
    console.error("Failed to fetch residents:", error)
    return []
  }
}

export async function getResidentOptions() {
  try {
    return await prisma.resident.findMany({
      where: { status: ResidentStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nim: true,
        status: true,
      },
    })
  } catch (error) {
    console.error("Failed to fetch resident options:", error)
    return []
  }
}

export async function createResident(formData: {
  name: string
  nim: string
  niup?: string
  angkatan?: string
  prodi?: string
  wilayah?: string
  daerah?: string
  kotaAsal?: string
  fakultas?: string
  phone?: string
  roomId?: string
  status: ResidentStatus
  photo?: string | null
  asalCountryId?: string
  asalProvinceId?: string
  asalRegencyId?: string
  asalDistrictId?: string
  asalVillageId?: string
  
  // New Fields
  tempatLahir?: string
  tanggalLahir?: string | Date
  gender?: string
  nik?: string
  alamatLengkap?: string
  kodePos?: string
  fakultasId?: string
  prodiId?: string
  angkatanId?: string
}) {
  try {
    // Check if NIM is unique
    const existing = await prisma.resident.findUnique({
      where: { nim: formData.nim }
    })

    if (existing) {
      return { error: "Resident with this NIM is already registered." }
    }

    // Check NIUP uniqueness if provided
    if (formData.niup) {
      const existingNiup = await prisma.resident.findUnique({
        where: { niup: formData.niup }
      })
      if (existingNiup) {
        return { error: "Resident with this NIUP is already registered." }
      }
    }

    // Check if room is available and has capacity
    if (formData.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: formData.roomId },
        include: { residents: true }
      })

      if (!room) {
        return { error: "Selected room not found." }
      }

      if (room.status === RoomStatus.MAINTENANCE) {
        return { error: "Selected room is currently under maintenance." }
      }

      if (room.residents.length >= room.capacity) {
        return { error: "Selected room is already at full capacity." }
      }
    }

    const resident = await prisma.resident.create({
      data: {
        name: formData.name,
        photo: formData.photo || null,
        nim: formData.nim,
        niup: formData.niup || null,
        angkatan: formData.angkatan || null,
        prodi: formData.prodi || null,
        wilayah: formData.wilayah || null,
        daerah: formData.daerah || null,
        kotaAsal: formData.kotaAsal || null,
        fakultas: formData.fakultas || null,
        phone: formData.phone || null,
        roomId: formData.roomId || null,
        status: formData.status,
        asalCountryId: formData.asalCountryId || null,
        asalProvinceId: formData.asalProvinceId || null,
        asalRegencyId: formData.asalRegencyId || null,
        asalDistrictId: formData.asalDistrictId || null,
        asalVillageId: formData.asalVillageId || null,
        tempatLahir: formData.tempatLahir || null,
        tanggalLahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : null,
        gender: formData.gender || null,
        nik: formData.nik || null,
        alamatLengkap: formData.alamatLengkap || null,
        kodePos: formData.kodePos || null,
        fakultasId: formData.fakultasId || null,
        prodiId: formData.prodiId || null,
        angkatanId: formData.angkatanId || null
      }
    })

    // Auto-update room status if it reached capacity
    if (formData.roomId) {
      const updatedRoom = await prisma.room.findUnique({
        where: { id: formData.roomId },
        include: { residents: true }
      })

      if (updatedRoom && updatedRoom.residents.length >= updatedRoom.capacity) {
        await prisma.room.update({
          where: { id: formData.roomId },
          data: { status: RoomStatus.OCCUPIED }
        })
      }
    }

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true, resident }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register resident."
    return { error: message }
  }
}

export async function updateResident(
  id: string,
  formData: {
    name: string
    nim: string
    niup?: string
    angkatan?: string
    prodi?: string
    wilayah?: string
    daerah?: string
    kotaAsal?: string
    fakultas?: string
    phone?: string
    roomId?: string
    status: ResidentStatus
    photo?: string | null
    asalCountryId?: string
    asalProvinceId?: string
    asalRegencyId?: string
    asalDistrictId?: string
    asalVillageId?: string
    tempatLahir?: string
    tanggalLahir?: string | Date
    gender?: string
    nik?: string
    alamatLengkap?: string
    kodePos?: string
    fakultasId?: string
    prodiId?: string
    angkatanId?: string
  }
) {
  try {
    const existing = await prisma.resident.findFirst({
      where: {
        nim: formData.nim,
        NOT: { id }
      }
    })

    if (existing) {
      return { error: "Resident with this NIM is already registered." }
    }

    // Check NIUP uniqueness if provided (exclude self)
    if (formData.niup) {
      const existingNiup = await prisma.resident.findFirst({
        where: {
          niup: formData.niup,
          NOT: { id }
        }
      })
      if (existingNiup) {
        return { error: "Resident with this NIUP is already registered." }
      }
    }

    const oldResident = await prisma.resident.findUnique({
      where: { id }
    })

    const oldRoomId = oldResident?.roomId

    // Check room capacity if room changed
    if (formData.roomId && formData.roomId !== oldRoomId) {
      const room = await prisma.room.findUnique({
        where: { id: formData.roomId },
        include: { residents: true }
      })

      if (!room) {
        return { error: "Selected room not found." }
      }

      if (room.status === RoomStatus.MAINTENANCE) {
        return { error: "Selected room is currently under maintenance." }
      }

      if (room.residents.length >= room.capacity) {
        return { error: "Selected room is already at full capacity." }
      }
    }

    const resident = await prisma.resident.update({
      where: { id },
      data: {
        name: formData.name,
        photo: formData.photo || null,
        nim: formData.nim,
        niup: formData.niup || null,
        angkatan: formData.angkatan || null,
        prodi: formData.prodi || null,
        wilayah: formData.wilayah || null,
        daerah: formData.daerah || null,
        kotaAsal: formData.kotaAsal || null,
        fakultas: formData.fakultas || null,
        phone: formData.phone || null,
        roomId: formData.roomId || null,
        status: formData.status,
        asalCountryId: formData.asalCountryId || null,
        asalProvinceId: formData.asalProvinceId || null,
        asalRegencyId: formData.asalRegencyId || null,
        asalDistrictId: formData.asalDistrictId || null,
        asalVillageId: formData.asalVillageId || null,
        tempatLahir: formData.tempatLahir || null,
        tanggalLahir: formData.tanggalLahir ? new Date(formData.tanggalLahir) : null,
        gender: formData.gender || null,
        nik: formData.nik || null,
        alamatLengkap: formData.alamatLengkap || null,
        kodePos: formData.kodePos || null,
        fakultasId: formData.fakultasId || null,
        prodiId: formData.prodiId || null,
        angkatanId: formData.angkatanId || null
      }
    })

    const session = await getServerSession(authOptions)
    const userEmail = session?.user?.email || "System"

    if (oldResident) {
      const changedFields: string[] = []
      const oldValues: Record<string, unknown> = {}
      const newValues: Record<string, unknown> = {}

      // Only track human-readable fields, skip internal IDs and timestamps
      const TRACKED_FIELDS = [
        'name', 'nim', 'niup', 'phone', 'angkatan', 'prodi', 'wilayah', 'daerah',
        'kotaAsal', 'fakultas', 'status', 'roomId', 'gender', 'nik', 'tempatLahir',
        'tanggalLahir', 'alamatLengkap', 'kodePos', 'photo'
      ]

      for (const key of TRACKED_FIELDS) {
        const oldValue = (oldResident as Record<string, unknown>)[key]
        const newValue = (resident as Record<string, unknown>)[key]

        const oldStr = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue ?? "")
        const newStr = newValue instanceof Date ? newValue.toISOString() : String(newValue ?? "")

        if (oldStr !== newStr) {
          changedFields.push(key)
          oldValues[key] = oldValue instanceof Date ? oldValue.toISOString() : oldValue
          newValues[key] = newValue instanceof Date ? newValue.toISOString() : newValue
        }
      }

      if (changedFields.length > 0) {
        await prisma.auditLog.create({
          data: {
            action: "UPDATE_RESIDENT",
            entityType: "RESIDENT",
            entityId: id,
            performedBy: userEmail,
            oldValue: { ...oldValues } as Prisma.InputJsonValue,
            newValue: { ...newValues, changedFields } as Prisma.InputJsonValue
          }
        })
      }
    }

    // If room changed, handle old room status release and new room status occupation
    if (oldRoomId && oldRoomId !== formData.roomId) {
      await prisma.room.update({
        where: { id: oldRoomId },
        data: { status: RoomStatus.AVAILABLE }
      })
    }

    if (formData.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: formData.roomId },
        include: { residents: true }
      })
      if (room && room.residents.length >= room.capacity) {
        await prisma.room.update({
          where: { id: formData.roomId },
          data: { status: RoomStatus.OCCUPIED }
        })
      }
    }

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true, resident }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update resident."
    return { error: message }
  }
}

export async function deleteResident(id: string) {
  try {
    const resident = await prisma.resident.findUnique({
      where: { id }
    })

    if (!resident) {
      return { error: "Resident not found." }
    }

    const oldRoomId = resident.roomId

    await prisma.resident.delete({
      where: { id }
    })

    // Free up old room status
    if (oldRoomId) {
      await prisma.room.update({
        where: { id: oldRoomId },
        data: { status: RoomStatus.AVAILABLE }
      })
    }

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to check out resident."
    return { error: message }
  }
}

export async function bulkCreateResidents(data: {
  name: string
  nim: string
  niup?: string
  phone?: string
  angkatan?: string
  prodi?: string
  wilayah?: string
  daerah?: string
  kotaAsal?: string
  fakultas?: string
  roomNumber?: string
  tempatLahir?: string
  tanggalLahir?: string | Date
  gender?: string
  nik?: string
  alamatLengkap?: string
  kodePos?: string
}[]){
  try {
    let successCount = 0
    let skippedCount = 0

    // Get all rooms to lookup ID by number and check capacity
    const rooms = await prisma.room.findMany({
      include: { residents: true }
    })
    const roomMap = new Map<string, typeof rooms[0]>()
    rooms.forEach(r => roomMap.set(r.number, r))

    for (const row of data) {
      if (!row.name || !row.nim) continue

      // Check duplicate NIM
      const existing = await prisma.resident.findUnique({
        where: { nim: String(row.nim) }
      })

      if (existing) {
        skippedCount++
        continue
      }

      let roomId: string | null = null

      if (row.roomNumber) {
        const room = roomMap.get(String(row.roomNumber))
        if (room && room.status !== RoomStatus.MAINTENANCE && room.residents.length < room.capacity) {
          roomId = room.id
          // Optimistically update the in-memory room map capacity
          room.residents.push({ id: "temp", residentId: null, roomId: room.id } as unknown as typeof room.residents[0])
          
          if (room.residents.length >= room.capacity) {
            await prisma.room.update({
              where: { id: room.id },
              data: { status: RoomStatus.OCCUPIED }
            })
          }
        }
      }

      await prisma.resident.create({
        data: {
          name: String(row.name),
          nim: String(row.nim),
          niup: row.niup ? String(row.niup) : null,
          phone: row.phone ? String(row.phone) : null,
          angkatan: row.angkatan ? String(row.angkatan) : null,
          prodi: row.prodi ? String(row.prodi) : null,
          wilayah: row.wilayah ? String(row.wilayah) : null,
          daerah: row.daerah ? String(row.daerah) : null,
          kotaAsal: row.kotaAsal ? String(row.kotaAsal) : null,
          fakultas: row.fakultas ? String(row.fakultas) : null,
          tempatLahir: row.tempatLahir ? String(row.tempatLahir) : null,
          tanggalLahir: row.tanggalLahir ? new Date(row.tanggalLahir) : null,
          gender: row.gender ? String(row.gender) : null,
          nik: row.nik ? String(row.nik) : null,
          alamatLengkap: row.alamatLengkap ? String(row.alamatLengkap) : null,
          kodePos: row.kodePos ? String(row.kodePos) : null,
          roomId: roomId,
          status: ResidentStatus.ACTIVE
        }
      })
      successCount++
    }

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true, successCount, skippedCount }
  } catch (error) {
    console.error("Bulk upload error:", error)
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat mengimpor data."
    return { error: message }
  }
}

export async function bulkDeleteResidents(ids: string[]) {
  try {
    const residents = await prisma.resident.findMany({
      where: { id: { in: ids } },
      select: { roomId: true }
    })

    const roomIds = residents.map(r => r.roomId).filter(Boolean) as string[]

    await prisma.resident.deleteMany({
      where: { id: { in: ids } }
    })

    if (roomIds.length > 0) {
      await prisma.room.updateMany({
        where: { id: { in: roomIds } },
        data: { status: RoomStatus.AVAILABLE }
      })
    }

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    console.error("Bulk delete error:", error)
    const message = error instanceof Error ? error.message : "Gagal menghapus santri pilihan."
    return { error: message }
  }
}

export async function bulkMoveResidents(ids: string[], data: { roomId?: string }) {
  try {
    const residents = await prisma.resident.findMany({
      where: { id: { in: ids } },
      select: { roomId: true }
    })
    const oldRoomIds = residents.map(r => r.roomId).filter(Boolean) as string[]

    if (data.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: data.roomId },
        include: { residents: true }
      })
      if (!room) return { error: "Kamar tidak ditemukan." }
      if (room.status === RoomStatus.MAINTENANCE) return { error: "Kamar sedang dalam perbaikan." }
      if (room.residents.length + ids.length > room.capacity) {
        return { error: "Kapasitas kamar tidak mencukupi untuk jumlah santri yang dipilih." }
      }
    }

    await prisma.resident.updateMany({
      where: { id: { in: ids } },
      data: {
        roomId: data.roomId !== undefined ? data.roomId : undefined
      }
    })

    if (oldRoomIds.length > 0) {
      await prisma.room.updateMany({
        where: { id: { in: oldRoomIds } },
        data: { status: RoomStatus.AVAILABLE }
      })
    }

    if (data.roomId) {
      const room = await prisma.room.findUnique({
        where: { id: data.roomId },
        include: { residents: true }
      })
      if (room && room.residents.length >= room.capacity) {
        await prisma.room.update({
          where: { id: data.roomId },
          data: { status: RoomStatus.OCCUPIED }
        })
      }
    }

    revalidatePath("/dashboard/residents")
    revalidatePath("/dashboard/rooms")
    return { success: true }
  } catch (error) {
    console.error("Bulk move error:", error)
    const message = error instanceof Error ? error.message : "Gagal memindahkan santri pilihan."
    return { error: message }
  }
}
