import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRegisterPayload, validateRegistrationForm } from './validation.js';

test('cadastro exige aceitar os termos de participação', () => {
  const missingFields = validateRegisterPayload({
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana@teste.com',
    password: '123456',
    cpf: '12345678909',
    birthDate: '1998-04-10',
    phone: '11999999999',
    gender: 'feminino',
    zipCode: '01000000',
    street: 'Rua A',
    number: '123',
    complement: 'Casa',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    treatment: 'sr',
    acceptTerms: false,
  });

  assert.ok(missingFields.includes('Aceite participar dos fluxos de teste da plataforma'));
});

test('validação do formulário de cadastro reporta erro de aceite dos termos', () => {
  const errors = validateRegistrationForm({
    firstName: 'Ana',
    lastName: 'Silva',
    email: 'ana@teste.com',
    password: '123456',
    cpf: '12345678909',
    birthDate: '1998-04-10',
    phone: '11999999999',
    gender: 'feminino',
    treatment: 'sr',
    zipCode: '01000000',
    street: 'Rua A',
    number: '123',
    complement: 'Casa',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    acceptTerms: false,
  });

  assert.equal(errors.acceptTerms, 'Você precisa aceitar os termos para cadastrar.');
});
