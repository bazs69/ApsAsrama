import prisma from './src/lib/prisma';
import { compare } from 'bcrypt';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (!user) {
    console.log("User not found");
    return;
  }
  const isMatch = await compare('Admin@123', user.password);
  console.log("Does Admin@123 match DB hash?", isMatch);
}

main().then(() => process.exit(0)).catch(console.error);
