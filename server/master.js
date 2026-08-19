import { prisma } from './prisma.js';

export async function isMasterUser(userId) {
  const masterEmail = process.env.MASTER_USER_EMAIL?.trim().toLowerCase();
  if (!masterEmail) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, status: true },
  });

  return user?.email.toLowerCase() === masterEmail && user.status === 'master';
}

export async function resetPlatformData(masterEmail) {
  return prisma.$transaction(async (database) => {
    const deletedTransactions = await database.transaction.deleteMany();
    const deletedCreditAnalyses = await database.creditAnalysis.deleteMany();
    const deletedAccounts = await database.bankAccount.deleteMany();
    const deletedUsers = await database.user.deleteMany({
      where: { email: { not: masterEmail } },
    });

    return {
      users: deletedUsers.count,
      accounts: deletedAccounts.count,
      transactions: deletedTransactions.count,
      creditAnalyses: deletedCreditAnalyses.count,
    };
  });
}
