import prisma from './src/lib/prisma';

async function main() {
  const rooms = await prisma.room.findMany({ where: { daerahId: null } });
  console.log("Orphaned rooms:", rooms);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
