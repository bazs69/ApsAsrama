"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

import { cache } from "react"

// WILAYAH
export const getWilayah = cache(async () => {
  return await prisma.wilayah.findMany({ orderBy: { name: "asc" } })
})

export async function createWilayah(name: string) {
  return secureAction({
    module: "MasterData",
    action: "createWilayah",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Wilayah")
        const existing = await prisma.wilayah.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" } }
        })
        if (existing) throw BusinessError.alreadyExists("Wilayah")

        const data = await prisma.wilayah.create({ data: { name: cleanName } })
        revalidatePath("/dashboard/wilayah")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Wilayah")
      }
    }
  })
}

export async function updateWilayah(id: string, name: string) {
  return secureAction({
    module: "MasterData",
    action: "updateWilayah",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Wilayah")
        const exist = await prisma.wilayah.findUnique({ where: { id } })
        if (!exist) throw BusinessError.conflict("Wilayah")

        const duplicate = await prisma.wilayah.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, NOT: { id } }
        })
        if (duplicate) throw BusinessError.alreadyExists("Wilayah")

        const data = await prisma.wilayah.update({ where: { id }, data: { name: cleanName } })
        revalidatePath("/dashboard/wilayah")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Wilayah")
      }
    }
  })
}

export async function deleteWilayah(id: string) {
  return secureAction({
    module: "MasterData",
    action: "deleteWilayah",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const exist = await prisma.wilayah.findUnique({
          where: { id },
          include: { _count: { select: { daerahs: true } } }
        })
        if (!exist) throw BusinessError.conflict("Wilayah")
        if (exist._count.daerahs > 0) throw BusinessError.cannotDelete("Wilayah", "Daerah")

        await prisma.wilayah.delete({ where: { id } })
        revalidatePath("/dashboard/wilayah")
        return {}
      } catch (error) {
        throw mapPrismaError(error, "Wilayah")
      }
    }
  })
}

// DAERAH
export const getDaerah = cache(async () => {
  return await prisma.daerah.findMany({ orderBy: { name: "asc" } })
})

export async function createDaerah(name: string) {
  return secureAction({
    module: "MasterData",
    action: "createDaerah",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Daerah")
        const existing = await prisma.daerah.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" } }
        })
        if (existing) throw BusinessError.alreadyExists("Daerah")

        const data = await prisma.daerah.create({ data: { name: cleanName } })
        revalidatePath("/dashboard/daerah")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Daerah")
      }
    }
  })
}

export async function updateDaerah(id: string, name: string) {
  return secureAction({
    module: "MasterData",
    action: "updateDaerah",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Daerah")
        const exist = await prisma.daerah.findUnique({ where: { id } })
        if (!exist) throw BusinessError.conflict("Daerah")

        const duplicate = await prisma.daerah.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, NOT: { id } }
        })
        if (duplicate) throw BusinessError.alreadyExists("Daerah")

        const data = await prisma.daerah.update({ where: { id }, data: { name: cleanName } })
        revalidatePath("/dashboard/daerah")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Daerah")
      }
    }
  })
}

export async function deleteDaerah(id: string) {
  return secureAction({
    module: "MasterData",
    action: "deleteDaerah",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const exist = await prisma.daerah.findUnique({
          where: { id },
          include: { _count: { select: { rooms: true } } }
        })
        if (!exist) throw BusinessError.conflict("Daerah")
        if (exist._count.rooms > 0) throw BusinessError.cannotDelete("Daerah", "Kamar")

        await prisma.daerah.delete({ where: { id } })
        revalidatePath("/dashboard/daerah")
        return {}
      } catch (error) {
        throw mapPrismaError(error, "Daerah")
      }
    }
  })
}

// FAKULTAS
export const getFakultas = cache(async () => {
  return await prisma.fakultas.findMany({ orderBy: { name: "asc" } })
})

export async function createFakultas(name: string) {
  return secureAction({
    module: "MasterData",
    action: "createFakultas",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Fakultas")
        const existing = await prisma.fakultas.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" } }
        })
        if (existing) throw BusinessError.alreadyExists("Fakultas")

        const data = await prisma.fakultas.create({ data: { name: cleanName } })
        revalidatePath("/dashboard/akademik")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Fakultas")
      }
    }
  })
}

export async function updateFakultas(id: string, name: string) {
  return secureAction({
    module: "MasterData",
    action: "updateFakultas",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Fakultas")
        const exist = await prisma.fakultas.findUnique({ where: { id } })
        if (!exist) throw BusinessError.conflict("Fakultas")

        const duplicate = await prisma.fakultas.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, NOT: { id } }
        })
        if (duplicate) throw BusinessError.alreadyExists("Fakultas")

        const data = await prisma.fakultas.update({ where: { id }, data: { name: cleanName } })
        revalidatePath("/dashboard/akademik")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Fakultas")
      }
    }
  })
}

export async function deleteFakultas(id: string) {
  return secureAction({
    module: "MasterData",
    action: "deleteFakultas",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const exist = await prisma.fakultas.findUnique({
          where: { id },
          include: { _count: { select: { prodis: true, residents: true } } }
        })
        if (!exist) throw BusinessError.conflict("Fakultas")
        if (exist._count.prodis > 0) throw BusinessError.cannotDelete("Fakultas", "Program Studi")
        if (exist._count.residents > 0) throw BusinessError.cannotDelete("Fakultas", "Santri")

        await prisma.fakultas.delete({ where: { id } })
        revalidatePath("/dashboard/akademik")
        return {}
      } catch (error) {
        throw mapPrismaError(error, "Fakultas")
      }
    }
  })
}

// PRODI
export const getProdi = cache(async () => {
  return await prisma.prodi.findMany({ orderBy: { name: "asc" } })
})

export async function createProdi(name: string, fakultasId: string) {
  return secureAction({
    module: "MasterData",
    action: "createProdi",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Program Studi")
        const cleanFakultasId = BusinessValidation.validateParent(fakultasId, "Fakultas")

        const fakultas = await prisma.fakultas.findUnique({ where: { id: cleanFakultasId } })
        if (!fakultas) throw BusinessError.invalidReference("Fakultas")

        const existing = await prisma.prodi.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, fakultasId: cleanFakultasId }
        })
        if (existing) throw BusinessError.alreadyExists("Program Studi")

        const data = await prisma.prodi.create({ data: { name: cleanName, fakultasId: cleanFakultasId } })
        revalidatePath("/dashboard/akademik")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Program Studi")
      }
    }
  })
}

export async function updateProdi(id: string, name: string, fakultasId: string) {
  return secureAction({
    module: "MasterData",
    action: "updateProdi",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Program Studi")
        const cleanFakultasId = BusinessValidation.validateParent(fakultasId, "Fakultas")

        const exist = await prisma.prodi.findUnique({ where: { id } })
        if (!exist) throw BusinessError.conflict("Program Studi")

        const fakultas = await prisma.fakultas.findUnique({ where: { id: cleanFakultasId } })
        if (!fakultas) throw BusinessError.invalidReference("Fakultas")

        const duplicate = await prisma.prodi.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, fakultasId: cleanFakultasId, NOT: { id } }
        })
        if (duplicate) throw BusinessError.alreadyExists("Program Studi")

        const data = await prisma.prodi.update({ where: { id }, data: { name: cleanName, fakultasId: cleanFakultasId } })
        revalidatePath("/dashboard/akademik")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Program Studi")
      }
    }
  })
}

export async function deleteProdi(id: string) {
  return secureAction({
    module: "MasterData",
    action: "deleteProdi",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const exist = await prisma.prodi.findUnique({
          where: { id },
          include: { _count: { select: { angkatans: true, residents: true } } }
        })
        if (!exist) throw BusinessError.conflict("Program Studi")
        if (exist._count.angkatans > 0) throw BusinessError.cannotDelete("Program Studi", "Angkatan")
        if (exist._count.residents > 0) throw BusinessError.cannotDelete("Program Studi", "Santri")

        await prisma.prodi.delete({ where: { id } })
        revalidatePath("/dashboard/akademik")
        return {}
      } catch (error) {
        throw mapPrismaError(error, "Program Studi")
      }
    }
  })
}

// ANGKATAN
export const getAngkatan = cache(async () => {
  return await prisma.angkatan.findMany({ orderBy: { name: "asc" } })
})

export async function createAngkatan(name: string, prodiId: string) {
  return secureAction({
    module: "MasterData",
    action: "createAngkatan",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Angkatan")
        const cleanProdiId = BusinessValidation.validateParent(prodiId, "Program Studi")

        const prodi = await prisma.prodi.findUnique({ where: { id: cleanProdiId } })
        if (!prodi) throw BusinessError.invalidReference("Program Studi")

        const existing = await prisma.angkatan.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, prodiId: cleanProdiId }
        })
        if (existing) throw BusinessError.alreadyExists("Angkatan")

        const data = await prisma.angkatan.create({ data: { name: cleanName, prodiId: cleanProdiId } })
        revalidatePath("/dashboard/akademik")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Angkatan")
      }
    }
  })
}

export async function updateAngkatan(id: string, name: string, prodiId: string) {
  return secureAction({
    module: "MasterData",
    action: "updateAngkatan",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const cleanName = BusinessValidation.requireName(name, "Nama Angkatan")
        const cleanProdiId = BusinessValidation.validateParent(prodiId, "Program Studi")

        const exist = await prisma.angkatan.findUnique({ where: { id } })
        if (!exist) throw BusinessError.conflict("Angkatan")

        const prodi = await prisma.prodi.findUnique({ where: { id: cleanProdiId } })
        if (!prodi) throw BusinessError.invalidReference("Program Studi")

        const duplicate = await prisma.angkatan.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" }, prodiId: cleanProdiId, NOT: { id } }
        })
        if (duplicate) throw BusinessError.alreadyExists("Angkatan")

        const data = await prisma.angkatan.update({ where: { id }, data: { name: cleanName, prodiId: cleanProdiId } })
        revalidatePath("/dashboard/akademik")
        return { data }
      } catch (error) {
        throw mapPrismaError(error, "Angkatan")
      }
    }
  })
}

export async function deleteAngkatan(id: string) {
  return secureAction({
    module: "MasterData",
    action: "deleteAngkatan",
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)
      try {
        const exist = await prisma.angkatan.findUnique({
          where: { id },
          include: { _count: { select: { residents: true } } }
        })
        if (!exist) throw BusinessError.conflict("Angkatan")
        if (exist._count.residents > 0) throw BusinessError.cannotDelete("Angkatan", "Santri")

        await prisma.angkatan.delete({ where: { id } })
        revalidatePath("/dashboard/akademik")
        return {}
      } catch (error) {
        throw mapPrismaError(error, "Angkatan")
      }
    }
  })
}
