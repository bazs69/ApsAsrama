"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

// WILAYAH
export async function getWilayah() {
  return await prisma.wilayah.findMany({ orderBy: { name: "asc" } })
}

export async function createWilayah(name: string) {
  try {
    const data = await prisma.wilayah.create({ data: { name } })
    revalidatePath("/dashboard/wilayah")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Wilayah sudah ada." }
    return { error: "Gagal menambahkan wilayah." }
  }
}

export async function updateWilayah(id: string, name: string) {
  try {
    const data = await prisma.wilayah.update({ where: { id }, data: { name } })
    revalidatePath("/dashboard/wilayah")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Wilayah sudah ada." }
    return { error: "Gagal mengubah wilayah." }
  }
}

export async function deleteWilayah(id: string) {
  try {
    await prisma.wilayah.delete({ where: { id } })
    revalidatePath("/dashboard/wilayah")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus wilayah." }
  }
}

// DAERAH
export async function getDaerah() {
  return await prisma.daerah.findMany({ orderBy: { name: "asc" } })
}

export async function createDaerah(name: string) {
  try {
    const data = await prisma.daerah.create({ data: { name } })
    revalidatePath("/dashboard/daerah")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Daerah sudah ada." }
    return { error: "Gagal menambahkan daerah." }
  }
}

export async function updateDaerah(id: string, name: string) {
  try {
    const data = await prisma.daerah.update({ where: { id }, data: { name } })
    revalidatePath("/dashboard/daerah")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Daerah sudah ada." }
    return { error: "Gagal mengubah daerah." }
  }
}

export async function deleteDaerah(id: string) {
  try {
    await prisma.daerah.delete({ where: { id } })
    revalidatePath("/dashboard/daerah")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus daerah." }
  }
}

// FAKULTAS
export async function getFakultas() {
  return await prisma.fakultas.findMany({ orderBy: { name: "asc" } })
}

export async function createFakultas(name: string) {
  try {
    const data = await prisma.fakultas.create({ data: { name } })
    revalidatePath("/dashboard/akademik")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Fakultas sudah ada." }
    return { error: "Gagal menambahkan fakultas." }
  }
}

export async function updateFakultas(id: string, name: string) {
  try {
    const data = await prisma.fakultas.update({ where: { id }, data: { name } })
    revalidatePath("/dashboard/akademik")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Fakultas sudah ada." }
    return { error: "Gagal mengubah fakultas." }
  }
}

export async function deleteFakultas(id: string) {
  try {
    await prisma.fakultas.delete({ where: { id } })
    revalidatePath("/dashboard/akademik")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus fakultas." }
  }
}

// PRODI
export async function getProdi() {
  return await prisma.prodi.findMany({ orderBy: { name: "asc" } })
}

export async function createProdi(name: string, fakultasId: string) {
  try {
    const data = await prisma.prodi.create({ data: { name, fakultasId } })
    revalidatePath("/dashboard/akademik")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Prodi sudah ada di fakultas ini." }
    return { error: "Gagal menambahkan prodi." }
  }
}

export async function updateProdi(id: string, name: string, fakultasId: string) {
  try {
    const data = await prisma.prodi.update({ where: { id }, data: { name, fakultasId } })
    revalidatePath("/dashboard/akademik")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Prodi sudah ada di fakultas ini." }
    return { error: "Gagal mengubah prodi." }
  }
}

export async function deleteProdi(id: string) {
  try {
    await prisma.prodi.delete({ where: { id } })
    revalidatePath("/dashboard/akademik")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus prodi." }
  }
}

// ANGKATAN
export async function getAngkatan() {
  return await prisma.angkatan.findMany({ orderBy: { name: "asc" } })
}

export async function createAngkatan(name: string, prodiId: string) {
  try {
    const data = await prisma.angkatan.create({ data: { name, prodiId } })
    revalidatePath("/dashboard/akademik")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Angkatan sudah ada di prodi ini." }
    return { error: "Gagal menambahkan angkatan." }
  }
}

export async function updateAngkatan(id: string, name: string, prodiId: string) {
  try {
    const data = await prisma.angkatan.update({ where: { id }, data: { name, prodiId } })
    revalidatePath("/dashboard/akademik")
    return { success: true, data }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Angkatan sudah ada di prodi ini." }
    return { error: "Gagal mengubah angkatan." }
  }
}

export async function deleteAngkatan(id: string) {
  try {
    await prisma.angkatan.delete({ where: { id } })
    revalidatePath("/dashboard/akademik")
    return { success: true }
  } catch {
    return { error: "Gagal menghapus angkatan." }
  }
}
