import { validateRegisterPayload } from '../server/userSecurity.js';

const payload = {
  name: 'Usuário Teste',
  email: 'user@teste.com',
  password: '123456',
  cpf: '11111111111',
  phone: '(11) 99999-1111',
};

console.log(JSON.stringify(validateRegisterPayload(payload)));
