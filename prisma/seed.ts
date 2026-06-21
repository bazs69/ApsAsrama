import prisma from "../src/lib/prisma"
import { hash } from "bcrypt"

const DEFAULT_PERMISSIONS = [
  { module: "Dashboard", action: "View", code: "dashboard.view" },
  { module: "Formulir", action: "View", code: "formulir.view" },
  
  { module: "Data Santri", action: "View", code: "santri.view" },
  { module: "Data Santri", action: "Create", code: "santri.create" },
  { module: "Data Santri", action: "Update", code: "santri.update" },
  { module: "Data Santri", action: "Delete", code: "santri.delete" },
  
  { module: "Muallim", action: "View", code: "muallim.view" },
  { module: "Muallim", action: "Create", code: "muallim.create" },
  { module: "Muallim", action: "Update", code: "muallim.update" },
  { module: "Muallim", action: "Delete", code: "muallim.delete" },
  
  { module: "Penugasan", action: "View", code: "penugasan.view" },
  { module: "Penugasan", action: "Create", code: "penugasan.create" },
  { module: "Penugasan", action: "Update", code: "penugasan.update" },
  { module: "Penugasan", action: "Delete", code: "penugasan.delete" },
  
  { module: "Monitoring", action: "View", code: "monitoring.view" },
  { module: "Monitoring", action: "Create", code: "monitoring.create" },
  { module: "Monitoring", action: "Update", code: "monitoring.update" },
  { module: "Monitoring", action: "Delete", code: "monitoring.delete" },
  
  { module: "Absensi", action: "View", code: "absensi.view" },
  { module: "Absensi", action: "Create", code: "absensi.create" },
  { module: "Absensi", action: "Update", code: "absensi.update" },
  { module: "Absensi", action: "Delete", code: "absensi.delete" },
  
  { module: "Area", action: "View", code: "area.view" },
  { module: "Area", action: "Create", code: "area.create" },
  { module: "Area", action: "Update", code: "area.update" },
  { module: "Area", action: "Delete", code: "area.delete" },
  
  { module: "Akademik", action: "View", code: "akademik.view" },
  { module: "Akademik", action: "Create", code: "akademik.create" },
  { module: "Akademik", action: "Update", code: "akademik.update" },
  { module: "Akademik", action: "Delete", code: "akademik.delete" },
  
  { module: "KBM", action: "View", code: "kbm.view" },
  { module: "KBM", action: "Create", code: "kbm.create" },
  { module: "KBM", action: "Update", code: "kbm.update" },
  { module: "KBM", action: "Delete", code: "kbm.delete" },
  
  { module: "Role User", action: "View", code: "role.view" },
  { module: "Role User", action: "Create", code: "role.create" },
  { module: "Role User", action: "Update", code: "role.update" },
  { module: "Role User", action: "Delete", code: "role.delete" },
  
  { module: "Satker", action: "View", code: "satker.view" },
  { module: "Satker", action: "Create", code: "satker.create" },
  { module: "Satker", action: "Update", code: "satker.update" },
  { module: "Satker", action: "Delete", code: "satker.delete" },
  
  { module: "Pengaturan", action: "View", code: "pengaturan.view" },
  { module: "Pengaturan", action: "Create", code: "pengaturan.create" },
  { module: "Pengaturan", action: "Update", code: "pengaturan.update" },
  { module: "Pengaturan", action: "Delete", code: "pengaturan.delete" },
  
  { module: "Laporan", action: "View", code: "laporan.view" },
  { module: "Laporan", action: "Create", code: "laporan.create" },
  { module: "Laporan", action: "Export", code: "laporan.export" },
  
  { module: "Wilayah Administratif", action: "View", code: "wilayah.view" },
  { module: "Wilayah Administratif", action: "Create", code: "wilayah.create" },
  { module: "Wilayah Administratif", action: "Update", code: "wilayah.update" },
  { module: "Wilayah Administratif", action: "Delete", code: "wilayah.delete" },
  
  { module: "Audit Log", action: "View", code: "audit.view" }
]

async function main() {
  console.log("Seeding RBAC data...")

  // 1. Seed Permissions
  const permissionIds: string[] = []
  for (const permData of DEFAULT_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code: permData.code },
      update: {
        module: permData.module,
        action: permData.action,
        description: `Akses ${permData.action} untuk modul ${permData.module}`
      },
      create: {
        code: permData.code,
        module: permData.module,
        action: permData.action,
        description: `Akses ${permData.action} untuk modul ${permData.module}`
      }
    })
    permissionIds.push(perm.id)
  }
  console.log("Seeded Permissions.")

  // 2. Seed Super Admin Role
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: { isSystem: true },
    create: { name: "SUPER_ADMIN", isSystem: true }
  })
  console.log("Seeded Super Admin Role.")

  // 3. Assign all permissions to Super Admin
  for (const permId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permId
        }
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permId
      }
    })
  }
  console.log("Assigned permissions to Super Admin.")

  // Also create PEMBINA, PENGURUS, KEPALA_SATKER for backward compatibility if needed, but without all perms
  const otherRoles = ["PEMBINA", "PENGURUS", "KEPALA_SATKER"]
  for (const r of otherRoles) {
    await prisma.role.upsert({
      where: { name: r },
      update: { isSystem: true },
      create: { name: r, isSystem: true }
    })
  }
  console.log("Seeded other roles.")

  const hashedPassword = await hash("admin123", 10)

  // 4. Seed Admin User
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@example.com" }
  })

  if (existingAdmin) {
    await prisma.user.update({
      where: { email: "admin@example.com" },
      data: {
        password: hashedPassword,
        name: "Administrator",
        roleId: superAdminRole.id,
      }
    })
    console.log("Admin user updated.")
  } else {
    await prisma.user.create({
      data: {
        name: "Administrator",
        email: "admin@example.com",
        password: hashedPassword,
        roleId: superAdminRole.id,
      },
    })
    console.log("Admin user created.")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
