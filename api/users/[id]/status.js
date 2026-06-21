import { getUsers, sendJson, setUsers } from '../../_usersStore.js';
import { applyRateLimitHeaders, consumeRateLimit } from '../../_rateLimit.js';

export default function handler(request, response) {
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
  const users = getUsers();
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
  setUsers(users);

  sendJson(response, 200, {
    success: true,
    message: `Usuário ${status} com sucesso.`,
    user: users[userIndex],
  });
}
