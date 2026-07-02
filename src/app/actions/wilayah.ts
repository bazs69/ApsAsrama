"use server"

import prisma from "@/lib/prisma"
import { PERMISSIONS } from "@/lib/security/permissions"
import { requirePermission } from "@/lib/security/authorization"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { BusinessNormalizer } from "@/lib/business/businessNormalizer"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

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
  await requirePermission(PERMISSIONS.WILAYAH_VIEW)

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
  await requirePermission(PERMISSIONS.WILAYAH_CREATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Negara")
    const name = BusinessValidation.requireName(data.name, "Nama Negara")

    const existing = await prisma.country.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" } }] }
    })
    if (existing) throw BusinessError.alreadyExists("Negara")

    const created = await prisma.country.create({ data: { code, name } })
    await logAudit("CREATE", "COUNTRY", created.id, null, created)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Negara")
  }
}

export async function updateCountry(id: string, data: { code: string; name: string }) {
  await requirePermission(PERMISSIONS.WILAYAH_UPDATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Negara")
    const name = BusinessValidation.requireName(data.name, "Nama Negara")

    const oldData = await prisma.country.findUnique({ where: { id } })
    if (!oldData) throw BusinessError.conflict("Negara")

    const duplicate = await prisma.country.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" } }], NOT: { id } }
    })
    if (duplicate) throw BusinessError.alreadyExists("Negara")

    const updated = await prisma.country.update({ where: { id }, data: { code, name } })
    await logAudit("UPDATE", "COUNTRY", id, oldData, updated)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Negara")
  }
}

export async function deleteCountry(id: string) {
  await requirePermission(PERMISSIONS.WILAYAH_DELETE)
  if (!await checkCrudRateLimit()) return
  try {
    const oldData = await prisma.country.findUnique({
      where: { id },
      include: { _count: { select: { provinces: true, residents: true } } }
    })
    if (!oldData) throw BusinessError.conflict("Negara")
    if (oldData._count.provinces > 0) throw BusinessError.cannotDelete("Negara", "Provinsi")
    if (oldData._count.residents > 0) throw BusinessError.cannotDelete("Negara", "Santri")

    await prisma.country.delete({ where: { id } })
    await logAudit("DELETE", "COUNTRY", id, oldData, null)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Negara")
  }
}

// --- PROVINCE ---

export async function getProvinces(search: string = "", page: number = 1, countryId?: string) {
  await requirePermission(PERMISSIONS.WILAYAH_VIEW)

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
  await requirePermission(PERMISSIONS.WILAYAH_CREATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Provinsi")
    const name = BusinessValidation.requireName(data.name, "Nama Provinsi")
    const countryId = BusinessValidation.validateParent(data.countryId, "Negara")

    const country = await prisma.country.findUnique({ where: { id: countryId } })
    if (!country) throw BusinessError.invalidReference("Negara")

    const existing = await prisma.province.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, countryId }] }
    })
    if (existing) throw BusinessError.alreadyExists("Provinsi")

    const created = await prisma.province.create({ data: { code, name, countryId } })
    await logAudit("CREATE", "PROVINCE", created.id, null, created)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Provinsi")
  }
}

export async function updateProvince(id: string, data: { code: string; name: string; countryId: string }) {
  await requirePermission(PERMISSIONS.WILAYAH_UPDATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Provinsi")
    const name = BusinessValidation.requireName(data.name, "Nama Provinsi")
    const countryId = BusinessValidation.validateParent(data.countryId, "Negara")

    const oldData = await prisma.province.findUnique({ where: { id } })
    if (!oldData) throw BusinessError.conflict("Provinsi")

    const country = await prisma.country.findUnique({ where: { id: countryId } })
    if (!country) throw BusinessError.invalidReference("Negara")

    const duplicate = await prisma.province.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, countryId }], NOT: { id } }
    })
    if (duplicate) throw BusinessError.alreadyExists("Provinsi")

    const updated = await prisma.province.update({ where: { id }, data: { code, name, countryId } })
    await logAudit("UPDATE", "PROVINCE", id, oldData, updated)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Provinsi")
  }
}

export async function deleteProvince(id: string) {
  await requirePermission(PERMISSIONS.WILAYAH_DELETE)
  if (!await checkCrudRateLimit()) return
  try {
    const oldData = await prisma.province.findUnique({
      where: { id },
      include: { _count: { select: { regencies: true, residents: true } } }
    })
    if (!oldData) throw BusinessError.conflict("Provinsi")
    if (oldData._count.regencies > 0) throw BusinessError.cannotDelete("Provinsi", "Kabupaten/Kota")
    if (oldData._count.residents > 0) throw BusinessError.cannotDelete("Provinsi", "Santri")

    await prisma.province.delete({ where: { id } })
    await logAudit("DELETE", "PROVINCE", id, oldData, null)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Provinsi")
  }
}

// --- REGENCY ---

export async function getRegencies(search: string = "", page: number = 1, provinceId?: string) {
  await requirePermission(PERMISSIONS.WILAYAH_VIEW)

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
  await requirePermission(PERMISSIONS.WILAYAH_CREATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Kabupaten/Kota")
    const name = BusinessValidation.requireName(data.name, "Nama Kabupaten/Kota")
    const provinceId = BusinessValidation.validateParent(data.provinceId, "Provinsi")

    const province = await prisma.province.findUnique({ where: { id: provinceId } })
    if (!province) throw BusinessError.invalidReference("Provinsi")

    const existing = await prisma.regency.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, provinceId }] }
    })
    if (existing) throw BusinessError.alreadyExists("Kabupaten/Kota")

    const created = await prisma.regency.create({ data: { code, name, provinceId } })
    await logAudit("CREATE", "REGENCY", created.id, null, created)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Kabupaten/Kota")
  }
}

export async function updateRegency(id: string, data: { code: string; name: string; provinceId: string }) {
  await requirePermission(PERMISSIONS.WILAYAH_UPDATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Kabupaten/Kota")
    const name = BusinessValidation.requireName(data.name, "Nama Kabupaten/Kota")
    const provinceId = BusinessValidation.validateParent(data.provinceId, "Provinsi")

    const oldData = await prisma.regency.findUnique({ where: { id } })
    if (!oldData) throw BusinessError.conflict("Kabupaten/Kota")

    const province = await prisma.province.findUnique({ where: { id: provinceId } })
    if (!province) throw BusinessError.invalidReference("Provinsi")

    const duplicate = await prisma.regency.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, provinceId }], NOT: { id } }
    })
    if (duplicate) throw BusinessError.alreadyExists("Kabupaten/Kota")

    const updated = await prisma.regency.update({ where: { id }, data: { code, name, provinceId } })
    await logAudit("UPDATE", "REGENCY", id, oldData, updated)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Kabupaten/Kota")
  }
}

export async function deleteRegency(id: string) {
  await requirePermission(PERMISSIONS.WILAYAH_DELETE)
  if (!await checkCrudRateLimit()) return
  try {
    const oldData = await prisma.regency.findUnique({
      where: { id },
      include: { _count: { select: { districts: true, residents: true } } }
    })
    if (!oldData) throw BusinessError.conflict("Kabupaten/Kota")
    if (oldData._count.districts > 0) throw BusinessError.cannotDelete("Kabupaten/Kota", "Kecamatan")
    if (oldData._count.residents > 0) throw BusinessError.cannotDelete("Kabupaten/Kota", "Santri")

    await prisma.regency.delete({ where: { id } })
    await logAudit("DELETE", "REGENCY", id, oldData, null)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Kabupaten/Kota")
  }
}

// --- DISTRICT ---

export async function getDistricts(search: string = "", page: number = 1, regencyId?: string) {
  await requirePermission(PERMISSIONS.WILAYAH_VIEW)

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
  await requirePermission(PERMISSIONS.WILAYAH_CREATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Kecamatan")
    const name = BusinessValidation.requireName(data.name, "Nama Kecamatan")
    const regencyId = BusinessValidation.validateParent(data.regencyId, "Kabupaten/Kota")

    const regency = await prisma.regency.findUnique({ where: { id: regencyId } })
    if (!regency) throw BusinessError.invalidReference("Kabupaten/Kota")

    const existing = await prisma.district.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, regencyId }] }
    })
    if (existing) throw BusinessError.alreadyExists("Kecamatan")

    const created = await prisma.district.create({ data: { code, name, regencyId } })
    await logAudit("CREATE", "DISTRICT", created.id, null, created)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Kecamatan")
  }
}

export async function updateDistrict(id: string, data: { code: string; name: string; regencyId: string }) {
  await requirePermission(PERMISSIONS.WILAYAH_UPDATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Kecamatan")
    const name = BusinessValidation.requireName(data.name, "Nama Kecamatan")
    const regencyId = BusinessValidation.validateParent(data.regencyId, "Kabupaten/Kota")

    const oldData = await prisma.district.findUnique({ where: { id } })
    if (!oldData) throw BusinessError.conflict("Kecamatan")

    const regency = await prisma.regency.findUnique({ where: { id: regencyId } })
    if (!regency) throw BusinessError.invalidReference("Kabupaten/Kota")

    const duplicate = await prisma.district.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, regencyId }], NOT: { id } }
    })
    if (duplicate) throw BusinessError.alreadyExists("Kecamatan")

    const updated = await prisma.district.update({ where: { id }, data: { code, name, regencyId } })
    await logAudit("UPDATE", "DISTRICT", id, oldData, updated)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Kecamatan")
  }
}

export async function deleteDistrict(id: string) {
  await requirePermission(PERMISSIONS.WILAYAH_DELETE)
  if (!await checkCrudRateLimit()) return
  try {
    const oldData = await prisma.district.findUnique({
      where: { id },
      include: { _count: { select: { villages: true, residents: true } } }
    })
    if (!oldData) throw BusinessError.conflict("Kecamatan")
    if (oldData._count.villages > 0) throw BusinessError.cannotDelete("Kecamatan", "Desa/Kelurahan")
    if (oldData._count.residents > 0) throw BusinessError.cannotDelete("Kecamatan", "Santri")

    await prisma.district.delete({ where: { id } })
    await logAudit("DELETE", "DISTRICT", id, oldData, null)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Kecamatan")
  }
}

// --- VILLAGE ---

export async function getVillages(search: string = "", page: number = 1, districtId?: string) {
  await requirePermission(PERMISSIONS.WILAYAH_VIEW)

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
  await requirePermission(PERMISSIONS.WILAYAH_CREATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Desa/Kelurahan")
    const name = BusinessValidation.requireName(data.name, "Nama Desa/Kelurahan")
    const districtId = BusinessValidation.validateParent(data.districtId, "Kecamatan")

    const district = await prisma.district.findUnique({ where: { id: districtId } })
    if (!district) throw BusinessError.invalidReference("Kecamatan")

    const existing = await prisma.village.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, districtId }] }
    })
    if (existing) throw BusinessError.alreadyExists("Desa/Kelurahan")

    const created = await prisma.village.create({ data: { code, name, districtId } })
    await logAudit("CREATE", "VILLAGE", created.id, null, created)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Desa/Kelurahan")
  }
}

export async function updateVillage(id: string, data: { code: string; name: string; districtId: string }) {
  await requirePermission(PERMISSIONS.WILAYAH_UPDATE)
  if (!await checkCrudRateLimit()) return
  try {
    const code = BusinessValidation.requireCode(data.code, "Kode Desa/Kelurahan")
    const name = BusinessValidation.requireName(data.name, "Nama Desa/Kelurahan")
    const districtId = BusinessValidation.validateParent(data.districtId, "Kecamatan")

    const oldData = await prisma.village.findUnique({ where: { id } })
    if (!oldData) throw BusinessError.conflict("Desa/Kelurahan")

    const district = await prisma.district.findUnique({ where: { id: districtId } })
    if (!district) throw BusinessError.invalidReference("Kecamatan")

    const duplicate = await prisma.village.findFirst({
      where: { OR: [{ code }, { name: { equals: name, mode: "insensitive" }, districtId }], NOT: { id } }
    })
    if (duplicate) throw BusinessError.alreadyExists("Desa/Kelurahan")

    const updated = await prisma.village.update({ where: { id }, data: { code, name, districtId } })
    await logAudit("UPDATE", "VILLAGE", id, oldData, updated)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Desa/Kelurahan")
  }
}

export async function deleteVillage(id: string) {
  await requirePermission(PERMISSIONS.WILAYAH_DELETE)
  if (!await checkCrudRateLimit()) return
  try {
    const oldData = await prisma.village.findUnique({
      where: { id },
      include: { _count: { select: { residents: true } } }
    })
    if (!oldData) throw BusinessError.conflict("Desa/Kelurahan")
    if (oldData._count.residents > 0) throw BusinessError.cannotDelete("Desa/Kelurahan", "Santri")

    await prisma.village.delete({ where: { id } })
    await logAudit("DELETE", "VILLAGE", id, oldData, null)
    revalidatePath("/dashboard/referensi/wilayah")
  } catch (error) {
    throw mapPrismaError(error, "Desa/Kelurahan")
  }
}

// --- IMPORT ---
export async function importWilayah(rows: { code: string, name: string }[], type: string, parentId?: string) {
  await requirePermission(PERMISSIONS.WILAYAH_CREATE)
  if (!await checkCrudRateLimit()) throw BusinessError.validation("Too many requests.")

  if (!rows || rows.length === 0) throw BusinessError.validation("Data kosong")

  const codes = rows.map(r => BusinessNormalizer.normalizeCode(r.code))
  if (new Set(codes).size !== codes.length) {
    throw BusinessError.validation("Terdapat duplikasi kode dalam file Excel.")
  }

  try {
    const importedCount = await prisma.$transaction(async (tx) => {
      let count = 0

      for (const row of rows) {
        if (!row.code || !row.name) throw BusinessError.validation(`Kode dan nama tidak boleh kosong pada baris: ${JSON.stringify(row)}`)

        const code = BusinessNormalizer.normalizeCode(row.code)
        const name = BusinessNormalizer.normalizeName(row.name)

        if (type === "negara") {
          const exist = await tx.country.findUnique({ where: { code } })
          if (exist) throw BusinessError.alreadyExists(`Kode ${code}`)
          await tx.country.create({ data: { code, name } })
        } else if (type === "provinsi") {
          if (!parentId) throw BusinessError.parentRequired("Negara")
          const exist = await tx.province.findUnique({ where: { code } })
          if (exist) throw BusinessError.alreadyExists(`Kode ${code}`)
          await tx.province.create({ data: { code, name, countryId: parentId } })
        } else if (type === "kabupaten") {
          if (!parentId) throw BusinessError.parentRequired("Provinsi")
          const exist = await tx.regency.findUnique({ where: { code } })
          if (exist) throw BusinessError.alreadyExists(`Kode ${code}`)
          await tx.regency.create({ data: { code, name, provinceId: parentId } })
        } else if (type === "kecamatan") {
          if (!parentId) throw BusinessError.parentRequired("Kabupaten/Kota")
          const exist = await tx.district.findUnique({ where: { code } })
          if (exist) throw BusinessError.alreadyExists(`Kode ${code}`)
          await tx.district.create({ data: { code, name, regencyId: parentId } })
        } else if (type === "desa") {
          if (!parentId) throw BusinessError.parentRequired("Kecamatan")
          const exist = await tx.village.findUnique({ where: { code } })
          if (exist) throw BusinessError.alreadyExists(`Kode ${code}`)
          await tx.village.create({ data: { code, name, districtId: parentId } })
        }

        count++
      }

      return count
    })

    await logAudit("IMPORT", type.toUpperCase(), null, null, { importedCount })
    revalidatePath("/dashboard/referensi/wilayah")
    return { success: true, count: importedCount }
  } catch (error) {
    throw mapPrismaError(error, `Import ${type}`)
  }
}
