"use server"

import prisma from "@/lib/prisma"
import { PERMISSIONS } from "@/lib/security/permissions"
import { requirePermission } from "@/lib/security/authorization"
import { revalidatePath } from "next/cache"
import { checkCrudRateLimit } from "@/lib/security/crudRateLimit"
import { secureAction } from "@/lib/security/secureAction"
import { SECURITY_CONSTANTS } from "@/lib/security/securityConstants"
import { UserBusiness } from "@/lib/business/userBusiness"
import { BusinessError } from "@/lib/business/businessErrors"
import { BusinessValidation } from "@/lib/business/businessValidation"
import { mapPrismaError } from "@/lib/prisma/prismaErrorMapper"
import { sessionInvalidationStore } from "@/lib/auth/sessionInvalidationStore"
import { cache } from "react"

export const getRoles = cache(async () => {
  await requirePermission(PERMISSIONS.ROLE_VIEW)
  
  return await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      _count: {
        select: { users: true }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
})

export const getPermissions = cache(async () => {
  await requirePermission(PERMISSIONS.ROLE_VIEW)

  return await prisma.permission.findMany({
    orderBy: {
      module: 'asc'
    }
  })
})

export async function createRole(data: { name: string, permissions: string[] }) {
  return secureAction({
    module: "Role",
    action: "createRole",
    permission: PERMISSIONS.ROLE_CREATE,
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const validName = BusinessValidation.requireName(data.name, "Nama Role")
      const cleanPerms = UserBusiness.validatePermissionAssignment(data.permissions)

      try {
        const role = await prisma.$transaction(async (tx) => {
          // [5B.4] Validate duplicate role name inside transaction
          const existing = await tx.role.findUnique({ where: { name: validName } })
          if (existing) {
            throw BusinessError.alreadyExists(`Role dengan nama ${validName}`)
          }

          return await tx.role.create({
            data: {
              name: validName,
              permissions: {
                create: cleanPerms.map(id => ({
                  permission: {
                    connect: { id }
                  }
                }))
              }
            },
            include: {
              permissions: {
                include: {
                  permission: { select: { code: true } }
                }
              }
            }
          })
        })

        await sessionInvalidationStore.invalidateAll()
        revalidatePath("/dashboard/role-user")
        revalidatePath("/dashboard/settings")
        return role
      } catch (err) {
        throw mapPrismaError(err, "Buat Role")
      }
    }
  })
}

export async function updateRole(id: string, data: { name: string, permissions: string[] }) {
  return secureAction({
    module: "Role",
    action: "updateRole",
    permission: PERMISSIONS.ROLE_UPDATE,
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const role = await prisma.role.findUnique({ where: { id } })
      if (!role) throw BusinessError.invalidReference("Role")

      UserBusiness.validateSystemRoleModification(role)

      const validName = BusinessValidation.requireName(data.name, "Nama Role")
      const cleanPerms = UserBusiness.validatePermissionAssignment(data.permissions)

      if (role.name !== validName) {
        const existing = await prisma.role.findUnique({ where: { name: validName } })
        if (existing) {
          throw BusinessError.alreadyExists(`Role dengan nama ${validName}`)
        }
      }

      try {
        await prisma.$transaction([
          prisma.rolePermission.deleteMany({
            where: { roleId: id }
          }),
          prisma.role.update({
            where: { id },
            data: {
              name: validName,
              permissions: {
                create: cleanPerms.map(permId => ({
                  permission: { connect: { id: permId } }
                }))
              }
            }
          })
        ])

        await sessionInvalidationStore.invalidateAll()
        revalidatePath("/dashboard/role-user")
        revalidatePath("/dashboard/settings")
        return {}
      } catch (err) {
        throw mapPrismaError(err, "Perbarui Role")
      }
    }
  })
}

export async function deleteRole(id: string) {
  return secureAction({
    module: "Role",
    action: "deleteRole",
    permission: PERMISSIONS.ROLE_DELETE,
    executor: async () => {
      if (!await checkCrudRateLimit()) throw new Error(SECURITY_CONSTANTS.ERROR_CODES.RATE_001)

      const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } })
      if (!role) throw BusinessError.invalidReference("Role")

      UserBusiness.validateRoleDeletion(role)

      if (role.name === "SUPER_ADMIN") {
        const activeAdmins = await prisma.user.count({ where: { roleId: role.id } })
        UserBusiness.validateLastAdministrator("SUPER_ADMIN", activeAdmins)
      }

      try {
        await prisma.role.delete({ where: { id } })

        await sessionInvalidationStore.invalidateAll()
        revalidatePath("/dashboard/role-user")
        revalidatePath("/dashboard/settings")
        return {}
      } catch (err) {
        throw mapPrismaError(err, "Hapus Role")
      }
    }
  })
}
