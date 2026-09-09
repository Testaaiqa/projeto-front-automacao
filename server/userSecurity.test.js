import test from 'node:test';
import assert from 'node:assert/strict';

import { isUserListVisible, normalizeEmail, sanitizeUser, serializeUsers } from './userSecurity.js';

test('normalizes email to lowercase', () => {
  assert.equal(normalizeEmail('USER@TESTE.COM'), 'user@teste.com');
  assert.equal(normalizeEmail('  User@Teste.com  '), 'user@teste.com');
});

test('remove sensitive fields from public user payloads', () => {
  const user = {
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana@email.com',
    password: 'super-secret',
    cpf: '12345678909',
    birthDate: '1990-01-01',
    phone: '(11) 99999-9999',
    gender: 'feminino',
    status: 'ativo',
  };

  const safeUser = sanitizeUser(user);

  assert.deepEqual(safeUser.password, undefined);
  assert.deepEqual(safeUser.cpf, undefined);
  assert.deepEqual(safeUser.birthDate, undefined);
  assert.deepEqual(safeUser.phone, undefined);
  assert.deepEqual(safeUser.gender, undefined);
  assert.equal(safeUser.email, 'ana@email.com');
  assert.equal(safeUser.name, 'Ana Silva');
});

test('master users never appear in user lists', () => {
  const users = [
    { id: '1', email: 'normal@email.com', status: 'ativo', password: '123' },
    { id: '2', email: 'master@email.com', status: 'master', password: 'adm123' },
  ];

  const visibleUsers = serializeUsers(users);

  assert.equal(isUserListVisible(users[0]), true);
  assert.equal(isUserListVisible(users[1]), false);
  assert.equal(visibleUsers.length, 1);
  assert.equal(visibleUsers[0].email, 'normal@email.com');
  assert.equal(visibleUsers[0].password, undefined);
  assert.equal(visibleUsers[0].cpf, undefined);
});
