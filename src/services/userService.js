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

export async function resetPlatform(confirmation) {
  const response = await fetch(`${API_URL}/admin/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAccessToken()}` },
    body: JSON.stringify({ confirmation }),
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

export async function getAllUsers(search = '', page = 1, limit = 30) {
  try {
    const params = new URLSearchParams();

    if (search && search.trim().length >= 3) {
      params.set('search', search.trim());
    }

    if (page && Number(page) > 0) {
      params.set('page', String(page));
    }

    if (limit && Number(limit) > 0) {
      params.set('limit', String(limit));
    }

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_URL}/users${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        users: [],
        totalCount: 0,
        totalPages: 1,
        page: 1,
        message: 'Erro ao carregar usuários',
      };
    }

    const payload = await response.json();
    const users = Array.isArray(payload) ? payload : (Array.isArray(payload.users) ? payload.users : []);
    const totalCount = Number(payload.totalCount || users.length || 0);
    const totalPages = Number(payload.totalPages || 1);
    const currentPage = Number(payload.page || page || 1);

    return {
      success: true,
      users: users.filter((user) => {
        const role = String(user?.role || '').toLowerCase();
        const status = String(user?.status || '').toLowerCase();
        return role !== 'admin' && status !== 'master';
      }),
      totalCount,
      totalPages,
      page: currentPage,
      message: 'Usuários carregados com sucesso',
    };
  } catch (error) {
    return {
      success: false,
      users: [],
      totalCount: 0,
      totalPages: 1,
      page: 1,
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
