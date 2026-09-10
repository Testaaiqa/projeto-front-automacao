import { applyRateLimitHeaders, consumeRateLimit } from '../_rateLimit.js';
import { prisma } from '../../server/prisma.js';
import { isUserListVisible, normalizeEmail, sanitizeUser } from '../../server/userSecurity.js';

function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function validateContactPayload(userData) {
  const errors = [];

  if (userData.cpf && onlyDigits(userData.cpf).length !== 11) {
    errors.push('CPF deve ter 11 dígitos.');
  }

  if (userData.phone && (onlyDigits(userData.phone).length !== 10 && onlyDigits(userData.phone).length !== 11)) {
    errors.push('Telefone deve ter DDD e 8 ou 9 dígitos.');
  }

  return errors;
}

export default async function handler(request, response) {
  const rateLimit = consumeRateLimit(request, {
    keyPrefix: `user-detail:${request.method}`,
    capacity: 30,
    refillPerMinute: 20,
  });

  applyRateLimitHeaders(response, rateLimit);

  if (!rateLimit.allowed) {
    sendJson(response, 429, {
      success: false,
      message: 'Muitas requisições para este recurso. Aguarde alguns segundos e tente novamente.',
    });
    return;
  }

  const { id: userId } = request.query;
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    sendJson(response, 404, {
      success: false,
      message: 'Usuário não encontrado.',
    });
    return;
  }

  if (request.method === 'DELETE') {
    if (!isUserListVisible(existingUser)) {
      sendJson(response, 403, {
        success: false,
        message: 'Usuário protegido não pode ser removido por esta rota.',
      });
      return;
    }

    const deletedUser = await prisma.user.delete({ where: { id: userId } });

    sendJson(response, 200, {
      success: true,
      message: 'Usuário deletado com sucesso.',
      user: sanitizeUser(deletedUser),
    });
    return;
  }

  if (request.method === 'PUT') {
    const updateData = request.body || {};
    const normalizedUpdate = {
      ...updateData,
      email: updateData.email ? normalizeEmail(updateData.email) : updateData.email,
    };

    const contactErrors = validateContactPayload(normalizedUpdate);

    if (contactErrors.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: contactErrors.join(' '),
      });
      return;
    }

    if (!isUserListVisible(existingUser)) {
      sendJson(response, 403, {
        success: false,
        message: 'Usuário protegido não pode ser alterado por esta rota.',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: normalizedUpdate.name || existingUser.name,
        email: normalizedUpdate.email || existingUser.email,
        cpf: normalizedUpdate.cpf ?? existingUser.cpf,
        phone: normalizedUpdate.phone ?? existingUser.phone,
        firstName: normalizedUpdate.firstName ?? existingUser.firstName,
        lastName: normalizedUpdate.lastName ?? existingUser.lastName,
      },
    });

    sendJson(response, 200, {
      success: true,
      message: 'Usuário atualizado com sucesso.',
      user: sanitizeUser(updatedUser),
    });
    return;
  }

  response.setHeader('Allow', ['DELETE', 'PUT']);
  sendJson(response, 405, {
    success: false,
    message: 'Método não permitido.',
  });
}
