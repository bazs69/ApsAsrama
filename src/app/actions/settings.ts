"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { hash, compare } from "bcrypt"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: { select: { id: true, name: true } }, createdAt: true, satkerId: true, photo: true },
      orderBy: { createdAt: "asc" },
    })
  } catch {
    return []
  }
}

export async function createUser(formData: {
  name: string
  email: string
  password: string
  roleId: string
  satkerId?: string | null
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: formData.email } })
    if (existing) return { error: "Email sudah terdaftar." }

    const hashedPassword = await hash(formData.password, 10)

    const user = await prisma.user.create({
      data: {
        name: formData.name,
        email: formData.email,
        password: hashedPassword,
        roleId: formData.roleId,
        satkerId: formData.satkerId || null,
      },
    })

    revalidatePath("/dashboard/settings")
    return { success: true, userId: user.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat pengguna."
    return { error: message }
  }
}

export async function updateUser(
  id: string,
  formData: { name: string; roleId: string; satkerId?: string | null }
) {
  try {
    await prisma.user.update({
      where: { id },
      data: { name: formData.name, roleId: formData.roleId, satkerId: formData.satkerId || null },
    })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui pengguna."
    return { error: message }
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.id === id) return { error: "Tidak dapat menghapus akun Anda sendiri." }

    await prisma.user.delete({ where: { id } })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghapus pengguna."
    return { error: message }
  }
}

export async function updateProfile(
  id: string,
  formData: { name: string; currentPassword?: string; newPassword?: string; photo?: string | null }
) {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return { error: "Pengguna tidak ditemukan." }

    const updateData: Prisma.UserUpdateInput = { name: formData.name }
    if (formData.photo !== undefined) updateData.photo = formData.photo

    if (formData.newPassword) {
      if (!formData.currentPassword) return { error: "Masukkan password lama Anda." }

      const isValid = await compare(formData.currentPassword, user.password)
      if (!isValid) return { error: "Password lama salah." }

      if (formData.newPassword.length < 6) return { error: "Password baru minimal 6 karakter." }

      updateData.password = await hash(formData.newPassword, 10)
    }

    await prisma.user.update({ where: { id }, data: updateData })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui profil."
    return { error: message }
  }
}
