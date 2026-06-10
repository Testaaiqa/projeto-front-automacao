import {
  createUser,
  getUsers,
  sendJson,
  validateContactPayload,
  validateRegisterPayload,
} from './_usersStore.js';

export default function handler(request, response) {
  if (request.method === 'GET') {
    sendJson(response, 200, getUsers());
    return;
  }

  if (request.method === 'POST') {
    const userData = request.body || {};
    const missingFields = validateRegisterPayload(userData);

    if (missingFields.length > 0) {
      sendJson(response, 400, {
        success: false,
        message: `Campos obrigatorios: ${missingFields.join(', ')}.`,
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

    const users = getUsers();
    const userAlreadyExists = users.some((user) => user.email === userData.email);

    if (userAlreadyExists) {
      sendJson(response, 409, {
        success: false,
        message: 'Ja existe um usuario cadastrado com este e-mail.',
      });
      return;
    }

    const newUser = createUser(userData);

    sendJson(response, 201, {
      success: true,
      message: 'Usuario cadastrado com sucesso. Agora faca login.',
      user: newUser,
    });
    return;
  }

  response.setHeader('Allow', ['GET', 'POST']);
  sendJson(response, 405, {
    success: false,
    message: 'Metodo nao permitido.',
  });
}
