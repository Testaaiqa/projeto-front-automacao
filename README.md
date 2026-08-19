# 🚀 Como subir o projeto para utilizar o Cypress

Antes de executar os testes automatizados no Cypress, é necessário subir o projeto completo, incluindo o FRONT-END e o BACK-END da aplicação.

---

# 📦 Instalando as dependências

Execute o comando abaixo na raiz do projeto:

```bash
npm install
```

## Banco Neon com Prisma

Copie `.env.example` para `.env` e preencha `DATABASE_URL` com a connection string do Neon. Defina também um `AUTH_SECRET` exclusivo para os tokens de login.

Depois execute:

```bash
npx prisma generate
npm.cmd run prisma:migrate
```

Para produção, configure `DATABASE_URL` e `AUTH_SECRET` nas variáveis de ambiente do Vercel. O comando de build executa `prisma migrate deploy` antes de gerar o front-end, portanto as migrações são aplicadas no banco configurado para aquele ambiente. Não coloque a connection string no repositório.

O módulo bancário usa as rotas autenticadas `GET /banking/account`, `GET /banking/transactions`, `POST /banking/transfers` e `POST /banking/credit-analysis`. Envie o token retornado pelo login como `Authorization: Bearer <accessToken>`.

---

# 🔥 Subindo o BACK-END (API)

Abra um terminal e execute:

```bash
npm.cmd run api
```

Esse comando irá iniciar a API da aplicação.

---

# 💻 Subindo o FRONT-END

Abra outro terminal separado e execute:

```bash
npm.cmd run dev
```

Esse comando irá iniciar a aplicação front-end.

---

# 🌐 Executando o Cypress

Com o FRONT e BACK funcionando corretamente, agora você já pode iniciar os testes automatizados utilizando o Cypress.

🚀
