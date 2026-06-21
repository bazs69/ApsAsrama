require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const updatedSuperAdmins = await prisma.$executeRaw`UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN'`;
    console.log("Updated ADMIN to SUPER_ADMIN:", updatedSuperAdmins);
    
    const updatedPengurus = await prisma.$executeRaw`UPDATE "User" SET "role" = 'PENGURUS' WHERE "role" = 'STAFF'`;
    console.log("Updated STAFF to PENGURUS:", updatedPengurus);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
