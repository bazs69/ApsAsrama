require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  const newPassword = 'Password123!'
  const hashedPassword = await hash(newPassword, 10)
  await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { password: hashedPassword }
  })
  console.log('Password reset for admin@example.com to: ' + newPassword)
}

main()
