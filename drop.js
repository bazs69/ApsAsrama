const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$executeRawUnsafe('DROP TYPE IF EXISTS "Role" CASCADE;')
  .then(() => console.log('Dropped'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
