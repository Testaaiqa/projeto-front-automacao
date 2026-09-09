export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

export function isUserListVisible(user) {
  if (!user) return false;

  const role = String(user.role || '').toLowerCase();
  const status = String(user.status || '').toLowerCase();
  const masterEmail = process.env.MASTER_USER_EMAIL?.trim().toLowerCase();

  if (role === 'admin' || status === 'master') return false;
  if (masterEmail && normalizeEmail(user.email) === masterEmail) return false;

  return true;
}

export function sanitizeUser(user) {
  if (!user) return user;

  const {
    password,
    cpf,
    birthDate,
    phone,
    gender,
    createdAt,
    updatedAt,
    ...safeUser
  } = user;

  return {
    ...safeUser,
    id: safeUser.id,
    name: safeUser.name || `${safeUser.firstName || ''} ${safeUser.lastName || ''}`.trim(),
    firstName: safeUser.firstName || '',
    lastName: safeUser.lastName || '',
    email: safeUser.email,
    role: safeUser.role || (safeUser.status === 'master' ? 'admin' : 'common'),
    status: safeUser.status || 'ativo',
  };
}

export function serializeUsers(users = []) {
  return users
    .filter(isUserListVisible)
    .map(sanitizeUser);
}
