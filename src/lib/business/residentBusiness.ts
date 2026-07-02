/**
 * Resident Business Rule Layer
 * 
 * Single Source of Truth (SSOT) for Resident identity validation, academic hierarchy,
 * room assignment integrity, and bulk upload pre-validation.
 */

import { Prisma, ResidentStatus, RoomStatus } from "@prisma/client"
import { BusinessError } from "./businessErrors"
import { BusinessNormalizer } from "./businessNormalizer"

// Flexible client interface accepting both PrismaClient and Prisma.TransactionClient
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaExecutor = any

export const ResidentBusiness = {
  /**
   * Validates uniqueness of Resident identities (NIM, NIUP, NIK, Phone) against database.
   */
  async validateResidentIdentity(
    db: PrismaExecutor,
    identity: { nik?: string | null; nim?: string | null; niup?: string | null; phone?: string | null },
    excludeResidentId?: string
  ): Promise<void> {
    const nim = BusinessNormalizer.normalizeWhitespace(identity.nim)
    const niup = BusinessNormalizer.normalizeWhitespace(identity.niup)
    const nik = BusinessNormalizer.normalizeWhitespace(identity.nik)
    const phone = BusinessNormalizer.normalizeWhitespace(identity.phone)

    const conditions: Prisma.ResidentWhereInput[] = []
    if (nim) conditions.push({ nim })
    if (niup) conditions.push({ niup })
    if (nik) conditions.push({ nik })
    if (phone) conditions.push({ phone })

    if (conditions.length === 0) return

    const where: Prisma.ResidentWhereInput = {
      OR: conditions
    }
    if (excludeResidentId) {
      where.NOT = { id: excludeResidentId }
    }

    const existing = await db.resident.findFirst({ where })
    if (existing) {
      if (nim && existing.nim === nim) {
        throw BusinessError.alreadyExists(`Santri dengan NIM ${nim}`)
      }
      if (niup && existing.niup === niup) {
        throw BusinessError.alreadyExists(`Santri dengan NIUP ${niup}`)
      }
      if (nik && existing.nik === nik) {
        throw BusinessError.alreadyExists(`Santri dengan NIK ${nik}`)
      }
      if (phone && existing.phone === phone) {
        throw BusinessError.alreadyExists(`Santri dengan Nomor HP ${phone}`)
      }
      throw BusinessError.alreadyExists("Santri dengan identitas tersebut")
    }
  },

  /**
   * Validates academic hierarchy integrity (Prodi belongs to Fakultas, Angkatan belongs to Prodi).
   */
  async validateAcademicHierarchy(
    db: PrismaExecutor,
    ids: { fakultasId?: string | null; prodiId?: string | null; angkatanId?: string | null }
  ): Promise<void> {
    if (ids.prodiId) {
      const prodi = await db.prodi.findUnique({ where: { id: ids.prodiId } })
      if (!prodi) throw BusinessError.invalidReference("Program Studi")

      if (ids.fakultasId && prodi.fakultasId !== ids.fakultasId) {
        throw BusinessError.validation("Relasi akademik tidak valid: Program Studi tidak sesuai dengan Fakultas yang dipilih.")
      }
    }

    if (ids.angkatanId) {
      const angkatan = await db.angkatan.findUnique({ where: { id: ids.angkatanId } })
      if (!angkatan) throw BusinessError.invalidReference("Angkatan")

      if (ids.prodiId && angkatan.prodiId !== ids.prodiId) {
        throw BusinessError.validation("Relasi akademik tidak valid: Angkatan tidak sesuai dengan Program Studi yang dipilih.")
      }
    }
  },

  /**
   * Validates room assignment (existence, status not MAINTENANCE, capacity check).
   */
  async validateRoomAssignment(
    db: PrismaExecutor,
    roomId: string,
    currentResidentId?: string,
    additionalOccupancy: number = 1
  ): Promise<{ id: string; number: string; capacity: number; residentsCount: number }> {
    const room = await db.room.findUnique({
      where: { id: roomId },
      include: { residents: true }
    }) as { id: string; number: string; capacity: number; status: RoomStatus; residents: Array<{ id: string }> } | null

    if (!room) {
      throw BusinessError.invalidReference("Kamar")
    }

    if (room.status === RoomStatus.MAINTENANCE) {
      throw BusinessError.validation(`Kamar ${room.number} tidak dapat digunakan karena sedang dalam perbaikan (maintenance).`)
    }

    let currentOccupancy = room.residents.length
    if (currentResidentId) {
      const isAlreadyInRoom = room.residents.some(r => r.id === currentResidentId)
      if (isAlreadyInRoom) {
        currentOccupancy = Math.max(0, currentOccupancy - 1)
      }
    }

    if (currentOccupancy + additionalOccupancy > room.capacity) {
      throw BusinessError.validation(`Kamar ${room.number} sudah penuh (kapasitas maksimal: ${room.capacity}).`)
    }

    return {
      id: room.id,
      number: room.number,
      capacity: room.capacity,
      residentsCount: currentOccupancy + additionalOccupancy
    }
  },

  /**
   * Synchronous helper for room capacity check.
   */
  validateRoomCapacity(room: { number?: string; capacity: number; residents: unknown[] }, additionalCount: number = 1): void {
    const roomNum = room.number ? ` ${room.number}` : ""
    if (room.residents.length + additionalCount > room.capacity) {
      throw BusinessError.validation(`Kamar${roomNum} sudah penuh (kapasitas maksimal: ${room.capacity}).`)
    }
  },

  /**
   * Validates and normalizes ResidentStatus.
   */
  validateResidentStatus(status?: string | null): ResidentStatus {
    const cleanStatus = (status || "").trim().toUpperCase()
    if (!cleanStatus) return ResidentStatus.ACTIVE
    if (Object.values(ResidentStatus).includes(cleanStatus as ResidentStatus)) {
      return cleanStatus as ResidentStatus
    }
    throw BusinessError.validation("Status santri tidak valid.")
  },

  /**
   * In-memory duplicate pre-validation for bulk imports.
   */
  validateBulkResidents(rows: Array<{ nim?: string; niup?: string; nik?: string; phone?: string; name?: string }>): void {
    if (!rows || rows.length === 0) {
      throw BusinessError.validation("File import tidak berisi data santri.")
    }

    const seenNIM = new Set<string>()
    const seenNIUP = new Set<string>()
    const seenNIK = new Set<string>()
    const seenPhone = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.name || !row.name.trim()) {
        throw BusinessError.validation(`Baris ke-${i + 1}: Nama Lengkap santri wajib diisi.`)
      }

      const nim = BusinessNormalizer.normalizeWhitespace(row.nim)
      const niup = BusinessNormalizer.normalizeWhitespace(row.niup)
      const nik = BusinessNormalizer.normalizeWhitespace(row.nik)
      const phone = BusinessNormalizer.normalizeWhitespace(row.phone)

      if (nim) {
        if (seenNIM.has(nim)) throw BusinessError.validation(`Duplikasi NIM ${nim} ditemukan dalam file import (Baris ${i + 1}).`)
        seenNIM.add(nim)
      }
      if (niup) {
        if (seenNIUP.has(niup)) throw BusinessError.validation(`Duplikasi NIUP ${niup} ditemukan dalam file import (Baris ${i + 1}).`)
        seenNIUP.add(niup)
      }
      if (nik) {
        if (seenNIK.has(nik)) throw BusinessError.validation(`Duplikasi NIK ${nik} ditemukan dalam file import (Baris ${i + 1}).`)
        seenNIK.add(nik)
      }
      if (phone) {
        if (seenPhone.has(phone)) throw BusinessError.validation(`Duplikasi Nomor HP ${phone} ditemukan dalam file import (Baris ${i + 1}).`)
        seenPhone.add(phone)
      }
    }
  }
}
