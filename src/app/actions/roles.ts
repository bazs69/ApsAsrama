"use server"

import prisma from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function getRoles() {
  if (!(await hasPermission("role.view"))) {
    throw new Error("Forbidden")
  }
  
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
}

export async function getPermissions() {
  if (!(await hasPermission("role.view"))) {
    throw new Error("Forbidden")
  }

  return await prisma.permission.findMany({
    orderBy: {
      module: 'asc'
    }
  })
}

export async function createRole(data: { name: string, permissions: string[] }) {
  if (!(await hasPermission("role.create"))) {
    throw new Error("Forbidden")
  }

  const { name, permissions } = data

  const role = await prisma.role.create({
    data: {
      name,
      permissions: {
        create: permissions.map(id => ({
          permission: {
            connect: { id }
          }
        }))
      }
    }
  })

  revalidatePath("/dashboard/role-user")
  revalidatePath("/dashboard/settings")
  return role
}

export async function updateRole(id: string, data: { name: string, permissions: string[] }) {
  if (!(await hasPermission("role.update"))) {
    throw new Error("Forbidden")
  }

  const role = await prisma.role.findUnique({ where: { id } })
  if (!role) throw new Error("Role not found")
  if (role.isSystem && role.name === "SUPER_ADMIN") {
    // SUPER_ADMIN cannot be renamed or have permissions reduced by normal UI.
    // We just prevent updating SUPER_ADMIN here for safety.
    throw new Error("Cannot modify SUPER_ADMIN role directly")
  }

  const { name, permissions } = data

  // Delete old permissions and insert new ones
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({
      where: { roleId: id }
    }),
    prisma.role.update({
      where: { id },
      data: {
        name,
        permissions: {
          create: permissions.map(permId => ({
            permission: { connect: { id: permId } }
          }))
        }
      }
    })
  ])

  revalidatePath("/dashboard/role-user")
  revalidatePath("/dashboard/settings")
  return { success: true }
}

export async function deleteRole(id: string) {
  if (!(await hasPermission("role.delete"))) {
    throw new Error("Forbidden")
  }

  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } })
  if (!role) throw new Error("Role not found")
  if (role.isSystem) throw new Error("System roles cannot be deleted")
  if (role._count.users > 0) throw new Error("Role is still assigned to users")

  await prisma.role.delete({ where: { id } })
  revalidatePath("/dashboard/role-user")
  revalidatePath("/dashboard/settings")
  return { success: true }
}
