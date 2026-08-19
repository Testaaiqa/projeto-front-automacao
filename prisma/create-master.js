import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const email = process.env.MASTER_USER_EMAIL?.trim().toLowerCase();
const password = process.env.MASTER_USER_PASSWORD;

if (!email || !password || password.length < 16) {
  console.error('Configure MASTER_USER_EMAIL e uma MASTER_USER_PASSWORD com pelo menos 16 caracteres em .master.env.');
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Administrador mestre',
      password,
      status: 'master',
    },
    create: {
      id: `master-${randomUUID()}`,
      name: 'Administrador mestre',
      email,
      password,
      status: 'master',
    },
  });

  console.log('Usuário mestre criado ou atualizado com sucesso.');
} finally {
  await prisma.$disconnect();
}
