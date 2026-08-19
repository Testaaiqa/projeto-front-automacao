import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const usersPath = resolve(process.cwd(), 'src/data/users.json');
const users = JSON.parse(await readFile(usersPath, 'utf8'));

for (const user of users) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      name: user.name,
      email: user.email,
      password: user.password,
      status: user.status || 'ativo',
    },
    create: {
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      cpf: user.cpf,
      birthDate: user.birthDate,
      phone: user.phone,
      gender: user.gender,
      status: user.status || 'ativo',
      account: { create: {} },
    },
  });
}

await prisma.bankAccount.updateMany({
  where: { balance: 0 },
  data: { balance: 5000 },
});

console.log(`${users.length} usuários sincronizados no Neon.`);
await prisma.$disconnect();