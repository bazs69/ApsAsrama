import prisma from './src/lib/prisma';
prisma.user.findMany()
  .then(u => {
      console.log('Users:', u.map(x=>x.email));
  })
  .catch(console.error)
  .finally(() => process.exit(0));
