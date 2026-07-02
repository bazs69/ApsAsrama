require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcrypt');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (!user) return console.log('no user');
  console.log('User found:', user.email);
  const isValid = await compare('Admin123!', user.password);
  console.log('Password Admin123! is valid:', isValid);
  const isValid2 = await compare('Admin123', user.password);
  console.log('Password Admin123 is valid:', isValid2);
}
main().catch(console.error);
