const API_URL = 'http://localhost:3001';

export async function loginUser(email, password) {
  if (!email || !password) {
    return {
      success: false,
      message: 'Informe e-mail e senha para fazer login.',
    };
  }

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
}

export async function createUser(userData) {
  const { firstName, lastName, email, password } = userData;

  if (!firstName || !lastName || !email || !password) {
    return {
      success: false,
      message: 'Preencha nome, sobrenome, e-mail e senha para cadastrar.',
    };
  }

  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  return response.json();
}
