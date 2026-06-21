import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readUsers, writeUsers } from './database.js';
import { applyRateLimitHeaders, consumeRateLimit } from '../api/_rateLimit.js';

const PORT = 3001;
const REQUIRED_REGISTER_FIELDS = [
  ['firstName', 'Nome'],
  ['lastName', 'Sobrenome'],
  ['email', 'E-mail'],
  ['password', 'Senha'],
  ['cpf', 'CPF'],
  ['birthDate', 'Data de nascimento'],
  ['phone', 'Telefone'],
  ['gender', 'Sexo'],
  ['zipCode', 'CEP'],
  ['street', 'Rua'],
  ['number', 'Número'],
  ['complement', 'Complemento'],
  ['neighborhood', 'Bairro'],
  ['city', 'Cidade'],
  ['state', 'Estado'],
];

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

function validateRegisterPayload(userData) {
  const missingFields = REQUIRED_REGISTER_FIELDS.filter(([fieldName]) => {
    return !String(userData[fieldName] || '').trim();
  }).map(([, label]) => label);

  if (!userData.callAsMr && !userData.callAsMrs && !userData.callAsOther) {
    missingFields.push('Forma de tratamento');
  }

  if (userData.callAsOther && !String(userData.treatmentOtherText || '').trim()) {
    missingFields.push('Outro tratamento');
  }

  return missingFields;
}

function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
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
      'Access-Control-Allow-Headers': 'Content-Type',
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

  if (request.method === 'GET' && request.url === '/users') {
    const users = await readUsers();
    sendJson(response, 200, users);
    return;
  }

  if (request.method === 'POST' && request.url === '/users') {
    const userData = await readRequestBody(request);
    const { firstName, lastName, email, password } = userData;
    const missingFields = validateRegisterPayload(userData);

    if (missingFields.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: `Campos obrigatórios: ${missingFields.join(', ')}.`,
      });
      return;
    }

    const contactErrors = validateContactPayload(userData, true);

    if (contactErrors.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: contactErrors.join(' '),
      });
      return;
    }

    const users = await readUsers();
    const userAlreadyExists = users.some((user) => user.email === email);

    if (userAlreadyExists) {
      sendJson(response, 409, {
        success: false,
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
      return;
    }

    const newUser = {
      id: randomUUID(),
      name: `${firstName} ${lastName}`,
      ...userData,
      email,
      password,
    };

    await writeUsers([...users, newUser]);

    sendJson(response, 201, {
      success: true,
      message: 'Usuário cadastrado com sucesso. Agora faça login.',
      user: newUser,
    });
    return;
  }

  if (request.method === 'POST' && request.url === '/login') {
    const { email, password } = await readRequestBody(request);

    if (!email || !password) {
      sendJson(response, 400, {
        success: false,
        message: 'Informe e-mail e senha para fazer login.',
      });
      return;
    }

    const users = await readUsers();
    const user = users.find(
      (currentUser) => currentUser.email === email && currentUser.password === password,
    );

    if (!user) {
      sendJson(response, 401, {
        success: false,
        message: 'Usuário ou senha inválidos.',
      });
      return;
    }

    sendJson(response, 200, {
      success: true,
      message: 'Login realizado com sucesso.',
      user,
    });
    return;
  }

  // DELETE /users/:id
  if (request.method === 'DELETE' && request.url.startsWith('/users/')) {
    const userId = request.url.split('/')[2];
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      sendJson(response, 404, {
        success: false,
        message: 'Usuário não encontrado.',
      });
      return;
    }

    const deletedUser = users[userIndex];
    const updatedUsers = users.filter((user) => user.id !== userId);
    await writeUsers(updatedUsers);

    sendJson(response, 200, {
      success: true,
      message: 'Usuário deletado com sucesso.',
      user: deletedUser,
    });
    return;
  }

  // PUT /users/:id - Atualizar usuário
  if (request.method === 'PUT' && request.url.startsWith('/users/') && !request.url.includes('/status')) {
    const userId = request.url.split('/')[2];
    const updateData = await readRequestBody(request);
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
      sendJson(response, 404, {
        success: false,
        message: 'Usuário não encontrado.',
      });
      return;
    }

    const contactErrors = validateContactPayload(updateData);

    if (contactErrors.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: contactErrors.join(' '),
      });
      return;
    }

    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      id: users[userIndex].id, // Impede mudança de ID
    };

    users[userIndex] = updatedUser;
    await writeUsers(users);

    sendJson(response, 200, {
      success: true,
      message: 'Usuário atualizado com sucesso.',
      user: updatedUser,
    });
    return;
  }

  // PATCH /users/:id/status - Alterar status do usuário
  if (request.method === 'PATCH' && request.url.startsWith('/users/') && request.url.includes('/status')) {
    const userId = request.url.split('/')[2];
    const { status } = await readRequestBody(request);
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex === -1) {
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

    users[userIndex].status = status;
    await writeUsers(users);

    sendJson(response, 200, {
      success: true,
      message: `Usuário ${status} com sucesso.`,
      user: users[userIndex],
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
