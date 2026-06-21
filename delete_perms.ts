import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.rolePermission.deleteMany()
  await prisma.permission.deleteMany()
  console.log("Deleted all permissions.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
