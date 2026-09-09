# PROJECT CONTEXT - Testa aí QA Platform

## Estrutura do Projeto
```
projeto-front-automacao/
├── index.html
├── package.json
├── README.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   ├── migrations/
│   └── create-master.js
├── server/
│   ├── api.js (API na porta 3001)
│   ├── auth.js
│   ├── banking.js
│   ├── database.js
│   ├── master.js
│   └── prisma.js
├── src/
│   ├── App.jsx (Componente principal com rotas)
│   ├── main.jsx (Entry point)
│   ├── styles.css (Estilos globais)
│   ├── services/
│   │   └── userService.js (Funções de autenticação/usuários)
│   ├── components/
│   │   ├── Sidebar.jsx (Menu sanduíche)
│   │   └── Header.jsx (Header com hamburger)
│   └── pages/
│       ├── Home.jsx (Dashboard)
│       ├── Usuarios.jsx (Gerenciar usuários)
│       ├── ProgressiveBar.jsx (Barra de progresso)
│       └── ComingSoon.jsx (Template em breve)
```

## Stack Tecnológico
- **Frontend:** React 19 + Vite 7
- **Estilização:** CSS puro
- **Backend:** Node.js + Prisma + Neon
- **Autenticação:** Email/Senha com dados no banco Neon

## Estados da Aplicação
1. **Login/Registro** - Tela de autenticação
2. **Dashboard** - Home com módulos disponíveis
3. **Páginas de Módulos** - Usuários, Progressive Bar, etc.

## Navegação (App.jsx)
```javascript
const [currentPage, setCurrentPage] = useState('login');
const [loggedUser, setLoggedUser] = useState(null);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);

// Pages: 'login', 'home', 'usuarios', 'progressive-bar', 'forms', 'tabelas', 'alerts'
```

## Componentes Principais

### Sidebar (Menu)
- Avatar do usuário
- Menu com 6 opções
- Botão de logout

### Header
- Botão hamburger
- Título "Testa aí QA"
- Saudação personalizada

### Home
- Grid de 6 módulos com cards
- Estatísticas (6 módulos, ∞ cenários, 100% automatizável)

### Usuarios
- Tabela com usuários vindos do banco Neon
- Botão para adicionar usuários
- Ações: editar, deletar

### ProgressiveBar
- Demo com barra animada
- Controles de velocidade
- Exemplos de uso

## Usuários no Sistema
A base de usuários está no banco Neon, acessada via Prisma. Os dados não ficam mais em arquivos locais JSON.

## Endpoints da API (localhost:3001)
- `POST /login` - Autenticar usuário
- `POST /users` - Criar novo usuário
- `GET /users` - Listar todos os usuários
- `GET /users/:id` - Buscar usuário por ID

## Scripts
```bash
npm run dev      # Vite dev server (porta 3000)
node server/api.js  # API Node (porta 3001)
```

## Serviços (userService.js)
- `loginUser(email, password)` - Autentica e retorna usuário
- `createUser(formData)` - Cria novo usuário
- `getAllUsers()` - Carrega todos os usuários
- `deleteUser(id)` - Deleta usuário

## Cores do Design
- Primária: #126d82 (azul-petroleo)
- Secundária: #ebd544 (amarelo)
- Sucesso: #59aa8a (verde)
- Perigo: #b42318 (vermelho)
- Background: #f3f6f8 (cinza claro)

## Funcionalidades Implementadas ✅
- [x] Autenticação com login/registro
- [x] Menu sanduíche com navegação
- [x] Dashboard com módulos
- [x] Página de usuários conectada ao banco Neon
- [x] Barra de progresso interativa
- [x] Design responsivo
- [x] Lógica de logout

## Próximas Melhorias
- [ ] CRUD completo de usuários
- [ ] Formulários, Tabelas, Alertas
- [ ] Testes com Cypress
