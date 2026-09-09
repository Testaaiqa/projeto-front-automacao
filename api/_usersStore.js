import { randomUUID } from 'node:crypto';

const seedUsers = [];

let users = seedUsers.map((user) => ({ ...user }));

export const REQUIRED_REGISTER_FIELDS = [
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

export function onlyDigits(value = '') {
  return String(value).replace(/\D/g, '');
}

export function validateCpf(cpf) {
  return onlyDigits(cpf).length === 11;
}

export function validatePhone(phone) {
  const digits = onlyDigits(phone);
  return digits.length === 10 || digits.length === 11;
}

export function validateContactPayload(userData, required = false) {
  const errors = [];

  if ((required || userData.cpf) && !validateCpf(userData.cpf)) {
    errors.push('CPF deve ter 11 dígitos.');
  }

  if ((required || userData.phone) && !validatePhone(userData.phone)) {
    errors.push('Telefone deve ter DDD e 8 ou 9 dígitos.');
  }

  return errors;
}

export function validateRegisterPayload(userData) {
  const missingFields = REQUIRED_REGISTER_FIELDS.filter(([fieldName]) => {
    return !String(userData[fieldName] || '').trim();
  }).map(([, label]) => label);

  if (!userData.treatment) {
    missingFields.push('Forma de tratamento');
  }

  if (userData.treatment === 'outro' && !String(userData.treatmentOtherText || '').trim()) {
    missingFields.push('Outro tratamento');
  }

  if (!userData.acceptTerms) {
    missingFields.push('Aceite participar dos fluxos de teste da plataforma');
  }

  return missingFields;
}

export function getUsers() {
  return users;
}

export function setUsers(nextUsers) {
  users = nextUsers;
  return users;
}

export function createUser(userData) {
  const newUser = {
    id: randomUUID(),
    name: `${userData.firstName} ${userData.lastName}`.trim(),
    ...userData,
  };

  users = [...users, newUser];
  return newUser;
}

export function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}
