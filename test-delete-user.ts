import prisma from "./src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true },
  });
  console.log("Users in DB:", users.map(u => ({ id: u.id, email: u.email, role: u.role?.name })));

  // Try to find a non-super-admin user to delete
  const targetUser = users.find(u => u.email !== "admin@example.com");
  if (!targetUser) {
    console.log("No non-admin user found.");
    return;
  }

  console.log(`Attempting to delete user ${targetUser.email} (${targetUser.id})`);
  try {
    const deleted = await prisma.user.delete({
      where: { id: targetUser.id },
      select: { email: true }
    });
    console.log("Deleted successfully:", deleted);
  } catch (err) {
    console.error("Delete failed:", err);
  }
}

main().finally(() => prisma.$disconnect());
