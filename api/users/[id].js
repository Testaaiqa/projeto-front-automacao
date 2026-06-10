import { getUsers, sendJson, setUsers, validateContactPayload } from '../_usersStore.js';

export default function handler(request, response) {
  const { id: userId } = request.query;
  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    sendJson(response, 404, {
      success: false,
      message: 'Usuario nao encontrado.',
    });
    return;
  }

  if (request.method === 'DELETE') {
    const deletedUser = users[userIndex];
    setUsers(users.filter((user) => user.id !== userId));

    sendJson(response, 200, {
      success: true,
      message: 'Usuario deletado com sucesso.',
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
      message: 'Usuario atualizado com sucesso.',
      user: updatedUser,
    });
    return;
  }

  response.setHeader('Allow', ['DELETE', 'PUT']);
  sendJson(response, 405, {
    success: false,
    message: 'Metodo nao permitido.',
  });
}
