const { PrismaClient } = require("@prisma/client")
const { PrismaNeon } = require("@prisma/adapter-neon")
const { neonConfig } = require("@neondatabase/serverless")
const ws = require("ws")
const bcrypt = require("bcrypt")

neonConfig.webSocketConstructor = ws

const connectionString = "postgresql://neondb_owner:npg_vscIY9gXqB6Z@ep-snowy-fire-aol9rr2c-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    console.log("Connecting...")
    const count = await prisma.user.count()
    if (count > 0) {
      console.log("Admin already exists! Skipped.")
      return
    }

    const hashedPassword = await bcrypt.hash("admin123", 10)
    const admin = await prisma.user.create({
      data: {
        name: "Administrator",
        email: "admin@example.com",
        password: hashedPassword,
        role: "ADMIN",
      }
    })
    console.log("Admin successfully created:", admin)
  } catch (err) {
    console.error("Error during seeding:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
