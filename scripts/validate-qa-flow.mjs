import { randomUUID } from 'node:crypto';

const API = 'http://localhost:3001';

const usersToCreate = [
  {
    firstName: 'Usuário',
    lastName: 'Teste A',
    name: 'Usuário Teste A',
    email: `usuario.teste.a.${randomUUID().slice(0, 8)}@teste.com`,
    password: '123456',
    cpf: '11111111111',
    birthDate: '1990-01-01',
    phone: '(11) 99999-1111',
    gender: 'masculino',
    treatment: 'senhor',
    treatmentOtherText: '',
    acceptTerms: true,
    zipCode: '01000-000',
    street: 'Rua A',
    number: '123',
    complement: '',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
  },
  {
    firstName: 'Usuário',
    lastName: 'Teste B',
    name: 'Usuário Teste B',
    email: `usuario.teste.b.${randomUUID().slice(0, 8)}@teste.com`,
    password: '123456',
    cpf: '22222222222',
    birthDate: '1991-02-02',
    phone: '(11) 88888-2222',
    gender: 'feminino',
    treatment: 'senhora',
    treatmentOtherText: '',
    acceptTerms: true,
    zipCode: '02000-000',
    street: 'Rua B',
    number: '456',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }

  return { ok: response.ok, status: response.status, payload };
}

async function main() {
  console.log('=== CRIANDO USUÁRIOS ===');
  for (const user of usersToCreate) {
    const created = await request('/users', { method: 'POST', body: JSON.stringify(user) });
    console.log(`${user.email} -> ${created.status} => ${JSON.stringify(created.payload)}`);
  }

  console.log('\n=== LISTA PÚBLICA APÓS CRIAÇÃO ===');
  const list = await request('/users');
  console.log(JSON.stringify(list.payload, null, 2));

  console.log('\n=== LOGIN QA ===');
  const qaLogin = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'qa@teste.com', password: '123456' }),
  });
  console.log(JSON.stringify(qaLogin.payload, null, 2));
  const qaToken = qaLogin.payload?.accessToken;

  if (!qaToken) {
    throw new Error('Token de QA não foi gerado.');
  }

  console.log('\n=== DEPÓSITO QA ===');
  const deposit = await request('/banking/deposits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qaToken}` },
    body: JSON.stringify({ amount: 250, description: 'Depósito de teste' }),
  });
  console.log(JSON.stringify(deposit.payload, null, 2));

  console.log('\n=== CONTA QA ===');
  const qaAccount = await request('/banking/account', { headers: { Authorization: `Bearer ${qaToken}` } });
  console.log(JSON.stringify(qaAccount.payload, null, 2));

  const recipientEmail = usersToCreate[1].email;
  console.log(`\n=== TRANSFERÊNCIA QA -> ${recipientEmail} ===`);
  const transfer = await request('/banking/transfers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${qaToken}` },
    body: JSON.stringify({ recipientEmail, amount: 75, description: 'Transferência de teste' }),
  });
  console.log(JSON.stringify(transfer.payload, null, 2));

  console.log('\n=== LOGIN DO USUÁRIO DESTINATÁRIO ===');
  const recipientLogin = await request('/login', {
    method: 'POST',
    body: JSON.stringify({ email: recipientEmail, password: '123456' }),
  });
  console.log(JSON.stringify(recipientLogin.payload, null, 2));

  const recipientToken = recipientLogin.payload?.accessToken;
  if (!recipientToken) {
    throw new Error('Token do destinatário não foi gerado.');
  }

  console.log('\n=== CONTA DO DESTINATÁRIO APÓS TRANSFERÊNCIA ===');
  const recipientAccount = await request('/banking/account', { headers: { Authorization: `Bearer ${recipientToken}` } });
  console.log(JSON.stringify(recipientAccount.payload, null, 2));
}

main().catch((error) => {
  console.error('VALIDATION_ERROR', error.message);
  console.error(error.stack);
  process.exitCode = 1;
});
