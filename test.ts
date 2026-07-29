import prisma from './src/lib/prisma';
prisma.resident.findMany().then(r => console.log('success, count:', r.length)).catch(console.error);
