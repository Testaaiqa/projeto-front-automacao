const FULL_REQUIRED_REGISTER_FIELDS = [
  ['firstName', 'Nome'],
  ['lastName', 'Sobrenome'],
  ['email', 'E-mail'],
  ['password', 'Senha'],
  ['cpf', 'CPF'],
  ['birthDate', 'Data de nascimento'],
  ['phone', 'Telefone'],
  ['gender', 'Sexo'],
  ['zipCode', 'CEP'],
  ['street', 'Rua'],
  ['number', 'Número'],
  ['complement', 'Complemento'],
  ['neighborhood', 'Bairro'],
  ['city', 'Cidade'],
  ['state', 'Estado'],
];

const ADMIN_REQUIRED_REGISTER_FIELDS = [
  ['name', 'Nome'],
  ['email', 'E-mail'],
  ['password', 'Senha'],
  ['cpf', 'CPF'],
  ['phone', 'Telefone'],
];

export function normalizeEmail(value = '') {
  return String(value).trim().toLowerCase();
}

function getFirstNameLastName(name = '') {
  const nameParts = String(name).trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts.shift() || '';
  return {
    firstName,
    lastName: nameParts.join(' '),
  };
}

export function validateRegisterPayload(userData = {}) {
  const normalizedData = { ...userData };
  if (!normalizedData.firstName && normalizedData.name) {
    normalizedData.firstName = getFirstNameLastName(normalizedData.name).firstName;
  }

  if (!normalizedData.lastName && normalizedData.name) {
    normalizedData.lastName = getFirstNameLastName(normalizedData.name).lastName;
  }

  const isAdminCreateScreen = Boolean(
    normalizedData.name &&
    normalizedData.email &&
    normalizedData.password &&
    normalizedData.cpf &&
    normalizedData.phone &&
    !normalizedData.birthDate &&
    !normalizedData.gender &&
    !normalizedData.zipCode &&
    !normalizedData.treatment &&
    !normalizedData.acceptTerms,
  );

  const requiredFields = isAdminCreateScreen ? ADMIN_REQUIRED_REGISTER_FIELDS : FULL_REQUIRED_REGISTER_FIELDS;
  const missingFields = requiredFields.filter(([fieldName]) => {
    return !String(normalizedData[fieldName] || '').trim();
  }).map(([, label]) => label);

  if (!isAdminCreateScreen) {
    if (!normalizedData.treatment) {
      missingFields.push('Forma de tratamento');
    }

    if (normalizedData.treatment === 'outro' && !String(normalizedData.treatmentOtherText || '').trim()) {
      missingFields.push('Outro tratamento');
    }

    if (!normalizedData.acceptTerms) {
      missingFields.push('Aceite participar dos fluxos de teste da plataforma');
    }
  }

  return missingFields;
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
    birthDate,
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
    cpf: safeUser.cpf || '-',
    phone: safeUser.phone || '-',
    role: safeUser.role || (safeUser.status === 'master' ? 'admin' : 'common'),
    status: safeUser.status || 'ativo',
  };
}

export function serializeUsers(users = []) {
  return users
    .filter(isUserListVisible)
    .map(sanitizeUser);
}
