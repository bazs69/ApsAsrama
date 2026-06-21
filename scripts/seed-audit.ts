import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const DATABASE_URL = "postgresql://postgres:root@localhost:5432/spthree_connect?schema=public"

const pool = new Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])

async function main() {
  console.log("Seeding audit.view permission...")

  // Upsert audit.view permission
  const perm = await prisma.permission.upsert({
    where: { code: "audit.view" },
    update: { module: "Audit Log", action: "View", description: "Akses melihat Audit Log" },
    create: { code: "audit.view", module: "Audit Log", action: "View", description: "Akses melihat Audit Log" }
  })
  console.log("✓ Permission upserted:", perm.id)

  // Assign to all system roles
  const systemRoles = await prisma.role.findMany({ where: { isSystem: true } })
  for (const role of systemRoles) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id }
    })
    console.log(`✓ Assigned audit.view to role: ${role.name}`)
  }

  console.log("\n✅ Done! audit.view permission seeded successfully.")
  
  await pool.end()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
