const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

const ACCESS_TOKEN_KEY = 'testa-ai-qa-access-token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function readApiResponse(response) {
  const body = await response.json().catch(() => ({}));
  return response.ok ? body : {
    success: false,
    message: body.message || `API respondeu com status ${response.status}.`,
  };
}

export async function getBankAccount() {
  const response = await fetch(`${API_URL}/banking/account`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  return readApiResponse(response);
}

export async function transferMoney(recipientEmail, amount, description = '') {
  const response = await fetch(`${API_URL}/banking/transfers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ recipientEmail, amount, description }),
  });
  return readApiResponse(response);
}

export async function depositMoney(amount, description = 'Depósito para testes') {
  const response = await fetch(`${API_URL}/banking/deposits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ amount, description }),
  });
  return readApiResponse(response);
}

export async function requestCreditAnalysis(requestedLimit) {
  const response = await fetch(`${API_URL}/banking/credit-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ requestedLimit }),
  });
  return readApiResponse(response);
}

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

  return readApiResponse(response);
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

  return readApiResponse(response);
}

export async function getAllUsers() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        users: [],
        message: 'Erro ao carregar usuários',
      };
    }

    const users = await response.json();
    return {
      success: true,
      users: Array.isArray(users) ? users : [],
      message: 'Usuários carregados com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      users: [],
      message: 'Erro ao conectar com a API',
    };
  }
}

export async function deleteUser(userId) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao deletar usuário',
    };
  }
}

export async function updateUser(userId, userData) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    return response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao atualizar usuário',
    };
  }
}

export async function toggleUserStatus(userId, newStatus) {
  try {
    const response = await fetch(`${API_URL}/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    return response.json();
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao alterar status do usuário',
    };
  }
}
