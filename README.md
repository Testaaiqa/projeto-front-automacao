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

## Monitor do syllabus CTFL

Em produção, o Vercel Cron consulta diariamente a página oficial do [ISTQB CTFL](https://www.istqb.org/certifications/certified-tester-foundation-level), identifica e baixa o syllabus e o par mais recente de PDFs de questões/respostas do Sample Exam. Versões, URLs e hashes dos quatro downloads são registrados no Neon; as questões e respostas de exemplo são validadas e descartadas após a checagem. A tabela binária conserva somente as duas versões mais recentes do syllabus, deduplicadas por hash e limitadas transacionalmente. Configure `CRON_SECRET` no Vercel para autorizar `/api/ctfl/syllabus/check`; o horário definido é 06:00 UTC. As migrações `20260930120000_add_ctfl_syllabus_monitor`, `20260930130000_add_ctfl_syllabus_documents` e `20260930140000_add_ctfl_sample_exam_monitor` criam as tabelas e os campos usados pelo monitor.

A prova PDF usa um banco JSON de 40 questões originais, com embaralhamento, navegação, timer CTFL (60 min ou 75 min) e nota mínima 26/40. O texto dos PDFs oficiais de exemplo não é copiado para esse JSON. O cron detecta alterações, mas não gera nem aprova novas questões: quando a versão amostrada muda, revise o banco e atualize `sourceSampleExamVersion` em `src/data/ctfl-question-bank.json`. Configure `CTFL_QUESTION_BANK_VERSION`, `CTFL_QUESTION_BANK_PDF_SHA256`, `CTFL_QUESTION_BANK_SAMPLE_VERSION` e `CTFL_QUESTION_BANK_SAMPLE_SHA256` somente após uma revisão humana dos materiais correspondentes; sem os fingerprints aprovados, o status fica em revisão. A base do percurso de IA permanece independente.

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
