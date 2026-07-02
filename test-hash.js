require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    select: { email: true, password: true }
  })
  console.log(users)
}
main().catch(console.error)
