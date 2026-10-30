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

## Preparacao CTFL (BSTQB)

A plataforma acompanha a referencia adotada no Brasil: syllabus CTFL v4.0 em portugues brasileiro, publicado pelo [BSTQB](https://www.bstqb.qa/ctfl). A prova tem 40 questoes, nota minima 26/40 e 60 minutos. A distribuicao e: capitulo 1, 8; capitulo 2, 6; capitulo 3, 4; capitulo 4, 11; capitulo 5, 9; capitulo 6, 2. O tempo adicional de 25% aplica-se ao candidato estrangeiro que faz a prova em portugues, conforme orientacao do BSTQB.

O banco ativo contem 47 questoes autorais e gera simulados de 40 conforme essa distribuicao. A versao anterior foi arquivada para preservar o historico, sem misturar edicoes do syllabus. Quando o syllabus muda, o monitor sinaliza revisao do banco; nao reaproveita nem descarta questoes automaticamente. Certificados obtidos continuam validos conforme a politica do ISTQB.

O monitor diario consulta a pagina do BSTQB e registra o PDF do syllabus e os Sample Exams A e B, com versoes, URLs e hashes. Ele alerta quando a versao ou os fingerprints aprovados diferem, mas nao altera nem aprova questoes automaticamente. Configure `CRON_SECRET` no Vercel para autorizar `/api/ctfl/syllabus/check`. Hashes aprovados exigem revisao humana; sem eles, o status permanece em revisao. A migracao `20261030180000_add_ctfl_sample_exam_sets` adiciona os metadados dos conjuntos A/B.

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
