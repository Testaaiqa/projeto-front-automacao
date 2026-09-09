import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedUsers = [
  {
    id: 'qa-default-user',
    name: 'Usuário QA',
    firstName: 'Usuário',
    lastName: 'QA',
    email: 'qa@teste.com',
    password: '123456',
    cpf: '12345678909',
    birthDate: '1990-01-01',
    phone: '(11) 99999-9999',
    gender: 'masculino',
    status: 'ativo',
  },
  {
    id: 'qa-default-user-2',
    name: 'André Luís',
    firstName: 'André',
    lastName: 'Luís',
    email: 'qa2@teste.com',
    password: 'Z5xu_6tBdmN7_Cj',
    cpf: '09090909090',
    birthDate: '1991-09-09',
    phone: '(00) 00000-9988',
    gender: 'masculino',
    status: 'ativo',
  },
];

for (const user of seedUsers) {
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

console.log(`${seedUsers.length} usuários sincronizados no Neon.`);
await prisma.$disconnect();
