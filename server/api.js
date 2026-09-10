import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { applyRateLimitHeaders, consumeRateLimit } from '../api/_rateLimit.js';
import { createAccessToken, getAuthenticatedUserId } from './auth.js';
import { handleBankingRequest } from './banking.js';
import { prisma } from './prisma.js';
import { isMasterUser, resetPlatformData } from './master.js';
import { sanitizeUser, serializeUsers, validateRegisterPayload } from './userSecurity.js';

const PORT = 3001;

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(body));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

function getFirstNameLastName(name = '') {
  const nameParts = String(name).trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() || '';
  return { firstName, lastName: nameParts.join(' ') };
}

function normalizeUser(user) {
  return sanitizeUser(user);
}

function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function validateCpf(cpf) {
  return onlyDigits(cpf).length === 11;
}

function validatePhone(phone) {
  const digits = onlyDigits(phone);
  return digits.length === 10 || digits.length === 11;
}

function validateContactPayload(userData, required = false) {
  const errors = [];

  if ((required || userData.cpf) && !validateCpf(userData.cpf)) {
    errors.push('CPF deve ter 11 dígitos.');
  }

  if ((required || userData.phone) && !validatePhone(userData.phone)) {
    errors.push('Telefone deve ter DDD e 8 ou 9 dígitos.');
  }

  return errors;
}

function getRateLimitConfig(request) {
  if (request.method === 'POST' && request.url === '/login') {
    return {
      keyPrefix: 'local-login',
      capacity: 8,
      refillPerMinute: 4,
    };
  }

  if (request.method === 'POST' && request.url === '/users') {
    return {
      keyPrefix: 'local-users-post',
      capacity: 20,
      refillPerMinute: 10,
    };
  }

  if (request.url?.startsWith('/users/')) {
    return {
      keyPrefix: `local-user-detail:${request.method}`,
      capacity: 30,
      refillPerMinute: 20,
    };
  }

  return {
    keyPrefix: `local-api:${request.method}`,
    capacity: 80,
    refillPerMinute: 80,
  };
}

const server = createServer(async (request, response) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    response.end();
    return;
  }

  const rateLimit = consumeRateLimit(request, getRateLimitConfig(request));
  applyRateLimitHeaders(response, rateLimit);

  if (!rateLimit.allowed) {
    sendJson(response, 429, {
      success: false,
      message: 'Muitas requisições. Aguarde alguns segundos e tente novamente.',
    });
    return;
  }

  const bankingHandled = await handleBankingRequest(
    request,
    (statusCode, body) => sendJson(response, statusCode, body),
    () => readRequestBody(request),
  );

  if (bankingHandled) {
    return;
  }

  if (request.method === 'GET' && request.url.startsWith('/users')) {
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

  if (request.method === 'POST' && request.url === '/admin/reset') {
    const userId = getAuthenticatedUserId(request);
    if (!userId) {
      sendJson(response, 401, {
        success: false,
        message: 'Token ausente, inválido ou expirado.',
      });
      return;
    }

    if (!(await isMasterUser(userId))) {
      sendJson(response, 403, {
        success: false,
        message: 'Apenas o usuário mestre pode limpar a plataforma.',
      });
      return;
    }

    const body = await readRequestBody(request);
    const REQUIRED_CONFIRMATION = 'RESETAR_TODA_A_PLATAFORMA';

    if (body.confirmation !== REQUIRED_CONFIRMATION) {
      sendJson(response, 400, {
        success: false,
        message: `Confirme a operação com ${REQUIRED_CONFIRMATION}.`,
      });
      return;
    }

    const masterEmail = process.env.MASTER_USER_EMAIL?.trim().toLowerCase();
    if (!masterEmail) {
      sendJson(response, 500, {
        success: false,
        message: 'Configuração do usuário mestre não encontrada.',
      });
      return;
    }

    const deleted = await resetPlatformData(masterEmail);
    sendJson(response, 200, {
      success: true,
      message: 'Plataforma limpa com sucesso.',
      deleted,
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/users') {
    const userData = await readRequestBody(request);
    const normalizedEmail = normalizeEmail(userData.email);
    const derivedNameParts = getFirstNameLastName(userData.name || '');
    const sanitizedUserData = {
      ...userData,
      email: normalizedEmail,
      firstName: userData.firstName || derivedNameParts.firstName,
      lastName: userData.lastName || derivedNameParts.lastName,
    };
    const { firstName, lastName, email, password } = sanitizedUserData;
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
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email: normalizedEmail,
        password,
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
      user: normalizeUser(newUser),
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/login') {
    const { email, password } = await readRequestBody(request);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      sendJson(response, 400, {
        success: false,
        message: 'Informe e-mail e senha para fazer login.',
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.password !== password) {
      sendJson(response, 401, {
        success: false,
        message: 'Usuário ou senha inválidos.',
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: 'Login realizado com sucesso.',
      user: normalizeUser(user),
      accessToken: createAccessToken(user.id),
    });
    return;
  }

  // DELETE /users/:id
  if (request.method === 'DELETE' && request.url.startsWith('/users/')) {
    const userId = request.url.split('/')[2];
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      sendJson(response, 404, {
        success: false,
        message: 'Usuário não encontrado.',
      });
      return;
    }

    const deletedUser = await prisma.user.delete({ where: { id: userId } });

    if (!isUserListVisible(deletedUser)) {
      sendJson(response, 403, {
        success: false,
        message: 'Usuário protegido não pode ser removido por esta rota.',
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: 'Usuário deletado com sucesso.',
      user: normalizeUser(deletedUser),
    });
    return;
  }

  // PUT /users/:id - Atualizar usuário
  if (request.method === 'PUT' && request.url.startsWith('/users/') && !request.url.includes('/status')) {
    const userId = request.url.split('/')[2];
    const updateData = await readRequestBody(request);
    const normalizedUpdate = {
      ...updateData,
      email: updateData.email ? normalizeEmail(updateData.email) : updateData.email,
    };
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });

    if (!existingUser) {
      sendJson(response, 404, {
        success: false,
        message: 'Usuário não encontrado.',
      });
      return;
    }

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
      user: normalizeUser(updatedUser),
    });
    return;
  }

  // PATCH /users/:id/status - Alterar status do usuário
  if (request.method === 'PATCH' && request.url.startsWith('/users/') && request.url.includes('/status')) {
    const userId = request.url.split('/')[2];
    const { status } = await readRequestBody(request);
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
      user: normalizeUser(updatedUser),
    });
    return;
  }

  sendJson(response, 404, {
    success: false,
    message: 'Rota não encontrada.',
  });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`A API já está rodando em http://localhost:${PORT}`);
    console.log('Use essa API aberta ou feche o outro terminal com Ctrl + C.');
    process.exit(0);
  }

  console.error(error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
