import { randomInt } from 'node:crypto';
import { prisma } from './prisma.js';
import { getAuthenticatedUserId } from './auth.js';

function money(value) {
  return Number(value);
}

function sendError(sendJson, status, message) {
  sendJson(status, { success: false, message });
}

async function getAccount(userId) {
  return prisma.bankAccount.upsert({ where: { userId }, update: {}, create: { userId, balance: 5000 } });
}

export async function handleBankingRequest(request, sendJson, readBody) {
  const path = request.url?.split('?')[0];
  if (!path?.startsWith('/banking/')) {
    return false;
  }

  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    sendError(sendJson, 401, 'Token ausente, inválido ou expirado.');
    return true;
  }

  try {
    if (request.method === 'GET' && path === '/banking/account') {
      const account = await getAccount(userId);
      const transactions = await prisma.transaction.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' }, take: 20 });
      sendJson(200, { success: true, account: { ...account, balance: money(account.balance), creditLimit: money(account.creditLimit) }, transactions });
      return true;
    }

    if (request.method === 'GET' && path === '/banking/transactions') {
      const account = await getAccount(userId);
      const transactions = await prisma.transaction.findMany({ where: { accountId: account.id }, orderBy: { createdAt: 'desc' }, take: 50 });
      sendJson(200, { success: true, transactions });
      return true;
    }

    if (request.method === 'POST' && path === '/banking/deposits') {
      const { amount, description } = await readBody();
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 999999999.99) {
        sendError(sendJson, 400, 'Informe um valor de depósito maior que zero.');
        return true;
      }

      const account = await getAccount(userId);
      const transaction = await prisma.$transaction(async (database) => {
        await database.bankAccount.update({ where: { id: account.id }, data: { balance: { increment: numericAmount } } });
        return database.transaction.create({ data: { accountId: account.id, recipientId: userId, type: 'DEPOSIT', amount: numericAmount, description } });
      });
      sendJson(201, { success: true, message: 'Saldo adicionado com sucesso.', transaction });
      return true;
    }

    if (request.method === 'POST' && path === '/banking/transfers') {
      const { recipientEmail, amount, description } = await readBody();
      const numericAmount = Number(amount);
      if (!recipientEmail || !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 999999999.99) {
        sendError(sendJson, 400, 'Informe destinatário e um valor maior que zero.');
        return true;
      }

      const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
      if (!recipient || recipient.id === userId) {
        sendError(sendJson, 404, 'Destinatário não encontrado.');
        return true;
      }

      const senderAccount = await getAccount(userId);
      const recipientAccount = await getAccount(recipient.id);
      const result = await prisma.$transaction(async (transaction) => {
        const updatedSender = await transaction.bankAccount.updateMany({ where: { id: senderAccount.id, balance: { gte: numericAmount } }, data: { balance: { decrement: numericAmount } } });
        if (updatedSender.count !== 1) throw new Error('INSUFFICIENT_FUNDS');
        await transaction.bankAccount.update({ where: { id: recipientAccount.id }, data: { balance: { increment: numericAmount } } });
        await transaction.transaction.create({ data: { accountId: senderAccount.id, senderId: userId, recipientId: recipient.id, type: 'TRANSFER_SENT', amount: numericAmount, description } });
        return transaction.transaction.create({ data: { accountId: recipientAccount.id, senderId: userId, recipientId: recipient.id, type: 'TRANSFER_RECEIVED', amount: numericAmount, description } });
      });
      sendJson(201, { success: true, message: 'Transferência realizada com sucesso.', transaction: result });
      return true;
    }

    if (request.method === 'POST' && path === '/banking/credit-analysis') {
      const { requestedLimit } = await readBody();
      const numericLimit = Number(requestedLimit);
      if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
        sendError(sendJson, 400, 'Informe um limite de crédito maior que zero.');
        return true;
      }
      const score = randomInt(0, 101);
      const account = await getAccount(userId);
      const currentCreditLimit = money(account.creditLimit);
      const approved = score >= 55 && currentCreditLimit < 10000;
      const newCreditLimit = approved ? Math.min(currentCreditLimit + 1000, 10000) : currentCreditLimit;
      const analysis = await prisma.$transaction(async (database) => {
        if (approved) {
          await database.bankAccount.update({ where: { id: account.id }, data: { creditLimit: newCreditLimit } });
        }
        return database.creditAnalysis.create({ data: { userId, requestedLimit: numericLimit, approvedLimit: approved ? newCreditLimit : null, status: approved ? 'APPROVED' : 'DENIED', score } });
      });
      sendJson(201, { success: true, analysis, newCreditLimit, increase: approved ? newCreditLimit - currentCreditLimit : 0, message: approved ? `Análise aprovada. Seu limite de crédito aumentou para R$ ${newCreditLimit.toFixed(2).replace('.', ',')}.` : currentCreditLimit >= 10000 ? 'Limite máximo de R$ 10.000,00 atingido.' : 'Análise não aprovada nesta tentativa.' });
      return true;
    }
  } catch (error) {
    if (error.message === 'INSUFFICIENT_FUNDS') {
      sendError(sendJson, 422, 'Saldo insuficiente para realizar a transferência.');
      return true;
    }
    console.error(error);
    sendError(sendJson, 503, 'Banco indisponível. Configure DATABASE_URL e execute as migrações.');
    return true;
  }

  return false;
}