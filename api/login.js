import { getUsers, sendJson } from './_usersStore.js';

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    sendJson(response, 405, {
      success: false,
      message: 'Método não permitido.',
    });
    return;
  }

  const { email, password } = request.body || {};

  if (!email || !password) {
    sendJson(response, 400, {
      success: false,
      message: 'Informe e-mail e senha para fazer login.',
    });
    return;
  }

  const user = getUsers().find(
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
}
