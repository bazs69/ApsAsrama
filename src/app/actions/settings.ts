"use server"

import { logOperationalError } from "@/lib/business/businessLogger"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { hash, compare } from "bcrypt"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Prisma } from "@prisma/client"
import { validatePassword } from "@/lib/security/passwordPolicy"
import { PERMISSIONS } from "@/lib/security/permissions"
import { requirePermission } from "@/lib/security/authorization"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { sessionInvalidationStore } from "@/lib/auth/sessionInvalidationStore"
import { dispatchNotification } from "@/lib/notifications/notificationDispatcher"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"
import { UserBusiness } from "@/lib/business/userBusiness"
import { BusinessError } from "@/lib/business/businessErrors"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"

/** Valid sort columns for the Users table */
export type UserSortField = "name" | "email" | "createdAt"
export type SortOrder = "asc" | "desc"

/** Filter-ready structure — all fields are optional */
export interface UserFilters {
  roleId?: string
  satkerId?: string
  /** ISO date strings for range queries */
  dateFrom?: string
  dateTo?: string
}

export async function getUsers(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  sort: UserSortField = "createdAt",
  order: SortOrder = "asc",
  // filters is accepted and forwarded to Prisma where clause
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: UserFilters = {},
) {
  try {
    await requirePermission(PERMISSIONS.PENGATURAN_VIEW)
    const skip = (page - 1) * pageSize

    // Build a search where clause — case-insensitive, partial match on name or email
    const searchWhere: Prisma.UserWhereInput = search.trim()
      ? {
          OR: [
            { name: { contains: search.trim(), mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search.trim(), mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}

    const [data, totalItems] = await Promise.all([
      prisma.user.findMany({
        where: searchWhere,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { id: true, name: true } },
          createdAt: true,
          satkerId: true,
          photo: true,
        },
        orderBy: { [sort]: order },
      }),
      prisma.user.count({ where: searchWhere }),
    ])

    return {
      data,
      metadata: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 0,
        currentPage: page,
        pageSize,
        search,
        sort,
        order,
      },
    }
  } catch {
    return {
      data: [],
      metadata: {
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        pageSize,
        search: "",
        sort: "createdAt" as UserSortField,
        order: "asc" as SortOrder,
      },
    }
  }
}


export async function createUser(formData: {
  name: string
  email: string
  password: string
  roleId: string
  satkerId?: string | null
}) {
  return secureAction({
    module: "Settings",
    action: "createUser",
    permission: PERMISSIONS.PENGATURAN_CREATE,
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const validName = UserBusiness.validateUsername(formData.name)
      const validEmail = UserBusiness.validateUserEmail(formData.email)
      const validRoleId = UserBusiness.validateRoleAssignment(formData.roleId)

      const pwResult = validatePassword(formData.password)
      if (!pwResult.valid) throw BusinessError.validation(pwResult.errors.join(". ") + ".")

      const hashedPassword = await hash(formData.password, 10)

      try {
        const user = await prisma.$transaction(async (tx) => {
          // [5B.4] Validate duplicate email inside transaction to prevent race conditions
          await UserBusiness.validateUserIdentity(tx, validEmail)

          return await tx.user.create({
            data: {
              name: validName,
              email: validEmail,
              password: hashedPassword,
              roleId: validRoleId,
              satkerId: formData.satkerId || null,
            },
          })
        })

        await dispatchNotification({
          userId: context.currentUserId,
          title: "Pengguna Baru Berhasil Dibuat",
          message: `Pengguna dengan email ${validEmail} berhasil didaftarkan ke sistem.`,
          type: "SUCCESS",
          metadata: { createdUserId: user.id, email: validEmail },
        }).catch(e => logOperationalError({ action: "Notification failed:", error: e }))

        revalidatePath("/dashboard/settings")
        return { userId: user.id }
      } catch (err) {
        throw mapPrismaError(err, "Buat Pengguna")
      }
    }
  })
}

export async function updateUser(
  id: string,
  formData: { name: string; roleId: string; satkerId?: string | null }
) {
  return secureAction({
    module: "Settings",
    action: "updateUser",
    permission: PERMISSIONS.PENGATURAN_UPDATE,
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const validName = UserBusiness.validateUsername(formData.name)
      const validRoleId = UserBusiness.validateRoleAssignment(formData.roleId)

      try {
        await prisma.user.update({
          where: { id },
          data: { name: validName, roleId: validRoleId, satkerId: formData.satkerId || null },
        })

        await sessionInvalidationStore.invalidateUser(id)

        revalidatePath("/dashboard/settings")
        return undefined
      } catch (err) {
        throw mapPrismaError(err, "Perbarui Pengguna")
      }
    }
  })
}

export async function deleteUser(id: string) {
  return secureAction({
    module: "Settings",
    action: "deleteUser",
    permission: PERMISSIONS.PENGATURAN_DELETE,
    executor: async (context) => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      UserBusiness.validateSelfDelete(id, context.currentUserId)

      try {
        await prisma.user.delete({ where: { id } })

        revalidatePath("/dashboard/settings")
        return undefined
      } catch (err) {
        throw mapPrismaError(err, "Hapus Pengguna")
      }
    }
  })
}

export async function updateProfile(
  id: string,
  formData: { name: string; currentPassword?: string; newPassword?: string; photo?: string | null }
) {
  try {
    // Verify caller is updating their own profile
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { error: "Unauthorized" }
    if (session.user.id !== id) return { error: "Forbidden" }

    if (!await checkCrudRateLimit()) return { error: "Too many requests." }

    const validName = UserBusiness.validateUsername(formData.name)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw BusinessError.invalidReference("Pengguna")
    }

    const updateData: Prisma.UserUpdateInput = { name: validName }
    if (formData.photo !== undefined) updateData.photo = formData.photo

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        throw BusinessError.validation("Masukkan password lama Anda.")
      }

      const isValid = await compare(formData.currentPassword, user.password)
      if (!isValid) {
        throw BusinessError.validation("Password lama salah.")
      }

      const pwResult = validatePassword(formData.newPassword)
      if (!pwResult.valid) {
        throw BusinessError.validation(pwResult.errors.join(". ") + ".")
      }

      updateData.password = await hash(formData.newPassword, 10)
    }

    const passwordChanged = !!formData.newPassword

    await prisma.user.update({ where: { id }, data: updateData })
    
    if (passwordChanged) {
      await sessionInvalidationStore.invalidateUser(id)
    }

    if (passwordChanged) {
      await dispatchNotification({
        userId: id,
        title: "Password Berhasil Diubah",
        message: "Password akun Anda telah berhasil diperbarui. Jika ini bukan Anda, segera hubungi admin.",
        type: "WARNING", // Security event
      }).catch(e => logOperationalError({ action: "Notification failed:", error: e }))
    } else {
      await dispatchNotification({
        userId: id,
        title: "Profil Diperbarui",
        message: "Informasi profil Anda telah berhasil disimpan.",
        type: "INFO",
      }).catch(e => logOperationalError({ action: "Notification failed:", error: e }))
    }

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    const businessErr = mapPrismaError(error, "Perbarui Profil")
    return { error: businessErr.message }
  }
}
