import { getUsers, sendJson, setUsers } from '../../_usersStore.js';

export default function handler(request, response) {
  if (request.method !== 'PATCH') {
    response.setHeader('Allow', ['PATCH']);
    sendJson(response, 405, {
      success: false,
      message: 'Metodo nao permitido.',
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
      message: 'Usuario nao encontrado.',
    });
    return;
  }

  if (!['ativo', 'inativo'].includes(status)) {
    sendJson(response, 400, {
      success: false,
      message: 'Status invalido. Use "ativo" ou "inativo".',
    });
    return;
  }

  users[userIndex].status = status;
  setUsers(users);

  sendJson(response, 200, {
    success: true,
    message: `Usuario ${status} com sucesso.`,
    user: users[userIndex],
  });
}
