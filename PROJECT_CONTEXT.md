# PROJECT CONTEXT - Testa ai QA Platform

## Estrutura do Projeto
```
projeto-front-automacao/
├── index.html
├── package.json
├── README.md
├── server/
│   ├── api.js (API na porta 3001)
│   └── database.js
├── src/
│   ├── App.jsx (Componente principal com rotas)
│   ├── main.jsx (Entry point)
│   ├── styles.css (Estilos globais)
│   ├── data/
│   │   └── users.json (Base de usuários)
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
- **Backend:** Node.js (API local)
- **Autenticação:** Email/Senha (usuários em users.json)

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
- Título "Testa ai QA"
- Saudação personalizada

### Home
- Grid de 6 módulos com cards
- Estatísticas (6 módulos, ∞ cenários, 100% automatizável)

### Usuarios
- Tabela com usuários do users.json
- Botão para adicionar usuários
- Ações: editar, deletar

### ProgressiveBar
- Demo com barra animada
- Controles de velocidade
- Exemplos de uso

## Usuários no Sistema (users.json)
```json
[
  {
    "id": "1",
    "name": "Usuario QA",
    "email": "qa@teste.com",
    "password": "123456"
  },
  {
    "id": "99052fb5...",
    "name": "andre luis",
    "email": "qa2@teste.com",
    "password": "Z5xu_6tBdmN7_Cj",
    ...
  },
  {
    "id": "afb6b4b4...",
    "name": "João Silva",
    "email": "joao@teste.com",
    "password": "123456",
    ...
  }
]
```

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
- [x] Página de usuários (SERÁ ATUALIZADA para users.json)
- [x] Barra de progresso interativa
- [x] Design responsivo
- [x] Lógica de logout

## Próximas Melhorias
- [ ] Carregar usuários reais do users.json
- [ ] CRUD completo de usuários
- [ ] Formulários, Tabelas, Alertas
- [ ] Testes com Cypress
