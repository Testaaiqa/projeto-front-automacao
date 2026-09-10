import { randomUUID } from 'node:crypto';
import { applyRateLimitHeaders, consumeRateLimit } from './_rateLimit.js';
import { prisma } from '../server/prisma.js';
import { normalizeEmail, sanitizeUser, serializeUsers, validateRegisterPayload } from '../server/userSecurity.js';

function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function getFirstNameLastName(name = '') {
  const nameParts = String(name).trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() || '';
  return { firstName, lastName: nameParts.join(' ') };
}

function validateContactPayload(userData, required = false) {
  const errors = [];

  if ((required || userData.cpf) && onlyDigits(userData.cpf).length !== 11) {
    errors.push('CPF deve ter 11 dígitos.');
  }

  if ((required || userData.phone) && (onlyDigits(userData.phone).length !== 10 && onlyDigits(userData.phone).length !== 11)) {
    errors.push('Telefone deve ter DDD e 8 ou 9 dígitos.');
  }

  return errors;
}

export default async function handler(request, response) {
  const isWriteRequest = request.method === 'POST';
  const rateLimit = consumeRateLimit(request, {
    keyPrefix: `users:${request.method}`,
    capacity: isWriteRequest ? 20 : 80,
    refillPerMinute: isWriteRequest ? 10 : 80,
  });

  applyRateLimitHeaders(response, rateLimit);

  if (!rateLimit.allowed) {
    sendJson(response, 429, {
      success: false,
      message: 'Muitas requisições para usuários. Aguarde alguns segundos e tente novamente.',
    });
    return;
  }

  if (request.method === 'GET') {
    const requestUrl = new URL(request.url, 'http://localhost');
    const search = requestUrl.searchParams.get('search')?.trim() || '';
    const page = Number(requestUrl.searchParams.get('page') || '1');
    const limit = Math.min(Number(requestUrl.searchParams.get('limit') || '30'), 30);
    const validPage = Number.isFinite(page) && page > 0 ? page : 1;
    const validLimit = Number.isFinite(limit) && limit > 0 ? limit : 30;

    const where = search.length >= 3
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const filteredUsers = serializeUsers(users);
    const totalCount = filteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / validLimit));
    const safePage = Math.min(validPage, totalPages);
    const startIndex = (safePage - 1) * validLimit;
    const pagedUsers = filteredUsers.slice(startIndex, startIndex + validLimit);

    sendJson(response, 200, {
      success: true,
      users: pagedUsers,
      totalCount,
      totalPages,
      page: safePage,
      limit: validLimit,
    });
    return;
  }

  if (request.method === 'POST') {
    const userData = request.body || {};
    const normalizedEmail = normalizeEmail(userData.email);
    const derivedNameParts = getFirstNameLastName(userData.name || '');
    const sanitizedUserData = {
      ...userData,
      email: normalizedEmail,
      firstName: userData.firstName || derivedNameParts.firstName,
      lastName: userData.lastName || derivedNameParts.lastName,
    };

    const missingFields = validateRegisterPayload(sanitizedUserData);

    if (missingFields.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: `Campos obrigatórios: ${missingFields.join(', ')}.`,
      });
      return;
    }

    const contactErrors = validateContactPayload(sanitizedUserData, true);

    if (contactErrors.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: contactErrors.join(' '),
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      sendJson(response, 409, {
        success: false,
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
      return;
    }

    const newUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: `${sanitizedUserData.firstName} ${sanitizedUserData.lastName}`.trim(),
        firstName: sanitizedUserData.firstName,
        lastName: sanitizedUserData.lastName,
        email: normalizedEmail,
        password: sanitizedUserData.password,
        cpf: sanitizedUserData.cpf,
        birthDate: sanitizedUserData.birthDate,
        phone: sanitizedUserData.phone,
        gender: sanitizedUserData.gender,
        role: 'common',
        status: sanitizedUserData.status || 'ativo',
        account: { create: {} },
      },
    });

    sendJson(response, 201, {
      success: true,
      message: 'Usuário cadastrado com sucesso. Agora faça login.',
      user: sanitizeUser(newUser),
    });
    return;
  }

  response.setHeader('Allow', ['GET', 'POST']);
  sendJson(response, 405, {
    success: false,
    message: 'Método não permitido.',
  });
}
