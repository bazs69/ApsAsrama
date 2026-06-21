"use server"

import prisma from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const ITEMS_PER_PAGE = 10

async function logAudit(action: string, entityType: string, entityId: string | null, oldValue: unknown, newValue: unknown) {
  const session = await getServerSession(authOptions)
  const performedBy = session?.user?.name || session?.user?.email || "System"

  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      performedBy
    }
  })
}

// --- COUNTRY ---

export async function getCountries(search: string = "", page: number = 1) {
  if (!(await hasPermission("wilayah.view"))) throw new Error("Forbidden")

  const skip = (page - 1) * ITEMS_PER_PAGE
  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { code: { contains: search, mode: "insensitive" as const } }] }
    : {}

  const [data, total] = await Promise.all([
    prisma.country.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { name: 'asc' },
    }),
    prisma.country.count({ where }),
  ])

  return { data, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

export async function createCountry(data: { code: string; name: string }) {
  if (!(await hasPermission("wilayah.create"))) throw new Error("Forbidden")
  const created = await prisma.country.create({ data })
  await logAudit("CREATE", "COUNTRY", created.id, null, created)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function updateCountry(id: string, data: { code: string; name: string }) {
  if (!(await hasPermission("wilayah.update"))) throw new Error("Forbidden")
  const oldData = await prisma.country.findUnique({ where: { id } })
  const updated = await prisma.country.update({ where: { id }, data })
  await logAudit("UPDATE", "COUNTRY", id, oldData, updated)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function deleteCountry(id: string) {
  if (!(await hasPermission("wilayah.delete"))) throw new Error("Forbidden")
  const oldData = await prisma.country.findUnique({ where: { id } })
  await prisma.country.delete({ where: { id } })
  await logAudit("DELETE", "COUNTRY", id, oldData, null)
  revalidatePath("/dashboard/referensi/wilayah")
}

// --- PROVINCE ---

export async function getProvinces(search: string = "", page: number = 1, countryId?: string) {
  if (!(await hasPermission("wilayah.view"))) throw new Error("Forbidden")

  const skip = (page - 1) * ITEMS_PER_PAGE
  const where: Record<string, unknown> = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }
    : {}

  if (countryId) where.countryId = countryId

  const [data, total] = await Promise.all([
    prisma.province.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { name: 'asc' },
      include: { country: true }
    }),
    prisma.province.count({ where }),
  ])

  return { data, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

export async function createProvince(data: { code: string; name: string; countryId: string }) {
  if (!(await hasPermission("wilayah.create"))) throw new Error("Forbidden")
  const created = await prisma.province.create({ data })
  await logAudit("CREATE", "PROVINCE", created.id, null, created)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function updateProvince(id: string, data: { code: string; name: string; countryId: string }) {
  if (!(await hasPermission("wilayah.update"))) throw new Error("Forbidden")
  const oldData = await prisma.province.findUnique({ where: { id } })
  const updated = await prisma.province.update({ where: { id }, data })
  await logAudit("UPDATE", "PROVINCE", id, oldData, updated)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function deleteProvince(id: string) {
  if (!(await hasPermission("wilayah.delete"))) throw new Error("Forbidden")
  const oldData = await prisma.province.findUnique({ where: { id } })
  await prisma.province.delete({ where: { id } })
  await logAudit("DELETE", "PROVINCE", id, oldData, null)
  revalidatePath("/dashboard/referensi/wilayah")
}

// --- REGENCY ---

export async function getRegencies(search: string = "", page: number = 1, provinceId?: string) {
  if (!(await hasPermission("wilayah.view"))) throw new Error("Forbidden")

  const skip = (page - 1) * ITEMS_PER_PAGE
  const where: Record<string, unknown> = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }
    : {}

  if (provinceId) where.provinceId = provinceId

  const [data, total] = await Promise.all([
    prisma.regency.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { name: 'asc' },
      include: { province: true }
    }),
    prisma.regency.count({ where }),
  ])

  return { data, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

export async function createRegency(data: { code: string; name: string; provinceId: string }) {
  if (!(await hasPermission("wilayah.create"))) throw new Error("Forbidden")
  const created = await prisma.regency.create({ data })
  await logAudit("CREATE", "REGENCY", created.id, null, created)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function updateRegency(id: string, data: { code: string; name: string; provinceId: string }) {
  if (!(await hasPermission("wilayah.update"))) throw new Error("Forbidden")
  const oldData = await prisma.regency.findUnique({ where: { id } })
  const updated = await prisma.regency.update({ where: { id }, data })
  await logAudit("UPDATE", "REGENCY", id, oldData, updated)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function deleteRegency(id: string) {
  if (!(await hasPermission("wilayah.delete"))) throw new Error("Forbidden")
  const oldData = await prisma.regency.findUnique({ where: { id } })
  await prisma.regency.delete({ where: { id } })
  await logAudit("DELETE", "REGENCY", id, oldData, null)
  revalidatePath("/dashboard/referensi/wilayah")
}

// --- DISTRICT ---

export async function getDistricts(search: string = "", page: number = 1, regencyId?: string) {
  if (!(await hasPermission("wilayah.view"))) throw new Error("Forbidden")

  const skip = (page - 1) * ITEMS_PER_PAGE
  const where: Record<string, unknown> = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }
    : {}

  if (regencyId) where.regencyId = regencyId

  const [data, total] = await Promise.all([
    prisma.district.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { name: 'asc' },
      include: { regency: true }
    }),
    prisma.district.count({ where }),
  ])

  return { data, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

export async function createDistrict(data: { code: string; name: string; regencyId: string }) {
  if (!(await hasPermission("wilayah.create"))) throw new Error("Forbidden")
  const created = await prisma.district.create({ data })
  await logAudit("CREATE", "DISTRICT", created.id, null, created)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function updateDistrict(id: string, data: { code: string; name: string; regencyId: string }) {
  if (!(await hasPermission("wilayah.update"))) throw new Error("Forbidden")
  const oldData = await prisma.district.findUnique({ where: { id } })
  const updated = await prisma.district.update({ where: { id }, data })
  await logAudit("UPDATE", "DISTRICT", id, oldData, updated)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function deleteDistrict(id: string) {
  if (!(await hasPermission("wilayah.delete"))) throw new Error("Forbidden")
  const oldData = await prisma.district.findUnique({ where: { id } })
  await prisma.district.delete({ where: { id } })
  await logAudit("DELETE", "DISTRICT", id, oldData, null)
  revalidatePath("/dashboard/referensi/wilayah")
}

// --- VILLAGE ---

export async function getVillages(search: string = "", page: number = 1, districtId?: string) {
  if (!(await hasPermission("wilayah.view"))) throw new Error("Forbidden")

  const skip = (page - 1) * ITEMS_PER_PAGE
  const where: Record<string, unknown> = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }] }
    : {}

  if (districtId) where.districtId = districtId

  const [data, total] = await Promise.all([
    prisma.village.findMany({
      where,
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { name: 'asc' },
      include: { district: true }
    }),
    prisma.village.count({ where }),
  ])

  return { data, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

export async function createVillage(data: { code: string; name: string; districtId: string }) {
  if (!(await hasPermission("wilayah.create"))) throw new Error("Forbidden")
  const created = await prisma.village.create({ data })
  await logAudit("CREATE", "VILLAGE", created.id, null, created)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function updateVillage(id: string, data: { code: string; name: string; districtId: string }) {
  if (!(await hasPermission("wilayah.update"))) throw new Error("Forbidden")
  const oldData = await prisma.village.findUnique({ where: { id } })
  const updated = await prisma.village.update({ where: { id }, data })
  await logAudit("UPDATE", "VILLAGE", id, oldData, updated)
  revalidatePath("/dashboard/referensi/wilayah")
}

export async function deleteVillage(id: string) {
  if (!(await hasPermission("wilayah.delete"))) throw new Error("Forbidden")
  const oldData = await prisma.village.findUnique({ where: { id } })
  await prisma.village.delete({ where: { id } })
  await logAudit("DELETE", "VILLAGE", id, oldData, null)
  revalidatePath("/dashboard/referensi/wilayah")
}

// --- IMPORT ---
export async function importWilayah(rows: { code: string, name: string }[], type: string, parentId?: string) {
  if (!(await hasPermission("wilayah.create"))) throw new Error("Forbidden")
  
  if (!rows || rows.length === 0) throw new Error("Data kosong")
  
  // Validate duplicates within the incoming payload
  const codes = rows.map(r => r.code)
  if (new Set(codes).size !== codes.length) {
    throw new Error("Terdapat duplikasi kode dalam file Excel.")
  }

  // Transaction
  const importedCount = await prisma.$transaction(async (tx) => {
    let count = 0
    
    for (const row of rows) {
      if (!row.code || !row.name) throw new Error(`Kode dan nama tidak boleh kosong pada baris: ${JSON.stringify(row)}`)
      
      const { code, name } = row
      
      if (type === "negara") {
        const exist = await tx.country.findUnique({ where: { code } })
        if (exist) throw new Error(`Kode ${code} sudah ada.`)
        await tx.country.create({ data: { code, name } })
      } else if (type === "provinsi") {
        if (!parentId) throw new Error("Induk wilayah (Negara) harus dipilih.")
        const exist = await tx.province.findUnique({ where: { code } })
        if (exist) throw new Error(`Kode ${code} sudah ada.`)
        await tx.province.create({ data: { code, name, countryId: parentId } })
      } else if (type === "kabupaten") {
        if (!parentId) throw new Error("Induk wilayah (Provinsi) harus dipilih.")
        const exist = await tx.regency.findUnique({ where: { code } })
        if (exist) throw new Error(`Kode ${code} sudah ada.`)
        await tx.regency.create({ data: { code, name, provinceId: parentId } })
      } else if (type === "kecamatan") {
        if (!parentId) throw new Error("Induk wilayah (Kabupaten/Kota) harus dipilih.")
        const exist = await tx.district.findUnique({ where: { code } })
        if (exist) throw new Error(`Kode ${code} sudah ada.`)
        await tx.district.create({ data: { code, name, regencyId: parentId } })
      } else if (type === "desa") {
        if (!parentId) throw new Error("Induk wilayah (Kecamatan) harus dipilih.")
        const exist = await tx.village.findUnique({ where: { code } })
        if (exist) throw new Error(`Kode ${code} sudah ada.`)
        await tx.village.create({ data: { code, name, districtId: parentId } })
      }
      
      count++
    }
    
    return count
  })

  await logAudit("IMPORT", type.toUpperCase(), null, null, { importedCount })
  revalidatePath("/dashboard/referensi/wilayah")
  return { success: true, count: importedCount }
}
