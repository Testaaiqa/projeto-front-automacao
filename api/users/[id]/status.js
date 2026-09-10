import { applyRateLimitHeaders, consumeRateLimit } from '../../_rateLimit.js';
import { prisma } from '../../../server/prisma.js';
import { isUserListVisible, sanitizeUser } from '../../../server/userSecurity.js';

function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}

export default async function handler(request, response) {
  const rateLimit = consumeRateLimit(request, {
    keyPrefix: 'user-status',
    capacity: 30,
    refillPerMinute: 20,
  });

  applyRateLimitHeaders(response, rateLimit);

  if (!rateLimit.allowed) {
    sendJson(response, 429, {
      success: false,
      message: 'Muitas alterações de status. Aguarde alguns segundos e tente novamente.',
    });
    return;
  }

  if (request.method !== 'PATCH') {
    response.setHeader('Allow', ['PATCH']);
    sendJson(response, 405, {
      success: false,
      message: 'Método não permitido.',
    });
    return;
  }

  const { id: userId } = request.query;
  const { status } = request.body || {};
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    sendJson(response, 404, {
      success: false,
      message: 'Usuário não encontrado.',
    });
    return;
  }

  if (!['ativo', 'inativo'].includes(status)) {
    sendJson(response, 400, {
      success: false,
      message: 'Status inválido. Use "ativo" ou "inativo".',
    });
    return;
  }

  if (!isUserListVisible(existingUser)) {
    sendJson(response, 403, {
      success: false,
      message: 'Usuário protegido não pode ter status alterado por esta rota.',
    });
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  sendJson(response, 200, {
    success: true,
    message: `Usuário ${status} com sucesso.`,
    user: sanitizeUser(updatedUser),
  });
}
