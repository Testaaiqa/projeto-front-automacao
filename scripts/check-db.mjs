import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['error'] });

try {
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('COUNT', users.length);
  console.log(JSON.stringify(users, null, 2));
} catch (error) {
  console.error('PRISMA_ERROR', error.message);
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
