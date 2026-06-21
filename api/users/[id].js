import { getUsers, sendJson, setUsers, validateContactPayload } from '../_usersStore.js';
import { applyRateLimitHeaders, consumeRateLimit } from '../_rateLimit.js';

export default function handler(request, response) {
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
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    sendJson(response, 404, {
      success: false,
      message: 'Usuário não encontrado.',
    });
    return;
  }

  if (request.method === 'DELETE') {
    const deletedUser = users[userIndex];
    setUsers(users.filter((user) => user.id !== userId));

    sendJson(response, 200, {
      success: true,
      message: 'Usuário deletado com sucesso.',
      user: deletedUser,
    });
    return;
  }

  if (request.method === 'PUT') {
    const updateData = request.body || {};
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
      id: users[userIndex].id,
    };

    users[userIndex] = updatedUser;
    setUsers(users);

    sendJson(response, 200, {
      success: true,
      message: 'Usuário atualizado com sucesso.',
      user: updatedUser,
    });
    return;
  }

  response.setHeader('Allow', ['DELETE', 'PUT']);
  sendJson(response, 405, {
    success: false,
    message: 'Método não permitido.',
  });
}
