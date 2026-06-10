# TESTA AI QA - Documentação Técnica Completa

## 📋 Resumo Executivo

**Projeto:** Plataforma Testa ai QA - Sistema de Automação com UI para Testes
**Status:** Em desenvolvimento
**Tecnologia:** React 19 + Vite + Node.js
**Porta Frontend:** 3000
**Porta API:** 3001

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas
```
projeto-front-automacao/
├── index.html                           # Entry HTML
├── package.json                        # Dependências
├── vite.config.js                      # Config Vite
├── server/
│   ├── api.js                         # API Node.js (porta 3001)
│   └── database.js                    # Funções de leitura/escrita JSON
├── src/
│   ├── App.jsx                        # Componente principal com roteamento
│   ├── main.jsx                       # React DOM render
│   ├── styles.css                     # Estilos globais (CSS puro)
│   ├── data/
│   │   └── users.json                 # Base de dados de usuários
│   ├── services/
│   │   └── userService.js             # API client functions
│   ├── components/
│   │   ├── Sidebar.jsx                # Menu sanduíche
│   │   └── Header.jsx                 # Cabeçalho com hamburger
│   └── pages/
│       ├── Home.jsx                   # Dashboard principal
│       ├── Usuarios.jsx               # Gerenciador de usuários
│       ├── ProgressiveBar.jsx         # Demo de barra de progresso
│       └── ComingSoon.jsx             # Template para módulos em breve
└── PROJECT_CONTEXT.md                 # Este arquivo
```

---

## 🔄 Fluxo de Dados

### 1. Autenticação
```
Login Form (App.jsx)
    ↓
loginUser() [userService.js]
    ↓
POST /login (api.js)
    ↓
readUsers() [database.js] → users.json
    ↓
Validação email/password
    ↓
setLoggedUser() + setCurrentPage('home')
```

### 2. Carregamento de Usuários
```
Usuarios.jsx monta
    ↓
useEffect → loadUsers()
    ↓
getAllUsers() [userService.js]
    ↓
GET /users (api.js)
    ↓
readUsers() [database.js] → users.json
    ↓
Mapeia dados para formato da tabela
    ↓
setUsers(mappedUsers)
```

### 3. Deleção de Usuário
```
Click no botão 🗑️
    ↓
handleDelete(userId)
    ↓
deleteUser(userId) [userService.js]
    ↓
DELETE /users/:id (api.js)
    ↓
writeUsers() [database.js] → salva users.json
    ↓
setUsers(filtered) → atualiza tabela
```

---

## 🗂️ Componentes e Páginas

### App.jsx (Componente Principal)
**Responsabilidades:**
- Gerenciar estado global: `loggedUser`, `currentPage`, `formMode`, `isSidebarOpen`
- Rotas: login → home → usuarios, progressive-bar, etc
- Tela de autenticação (login/registro)
- Dashboard com sidebar + header

**Estados:**
```javascript
const [currentPage, setCurrentPage] = useState('login');
const [loggedUser, setLoggedUser] = useState(null);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [formMode, setFormMode] = useState('login'); // 'login' ou 'register'
```

**Funções Chave:**
- `handleSubmit()` - Processa login/registro
- `handleNavigation(pageId)` - Troca de página
- `renderPageContent()` - Renderiza página atual

### Header.jsx
**Props:** `onMenuToggle`, `currentUser`
**Features:**
- Botão hamburger para abrir/fechar sidebar
- Título "Testa ai QA"
- Saudação personalizada com nome do usuário

### Sidebar.jsx
**Props:** `isOpen`, `onClose`, `onNavigate`, `currentUser`
**Features:**
- Avatar do usuário com letra inicial
- Nome e email do usuário
- Menu com 6 opções de navegação
- Botão de logout

**Itens do Menu:**
1. 🏠 Home
2. 👥 Usuários
3. 📊 Progressive Bar
4. 📋 Formulários
5. 📑 Tabelas
6. ⚠️ Alertas

### Home.jsx
**Features:**
- Mensagem de boas-vindas personalizada
- Grid responsivo com 6 módulos
- Cards com: ícone, título, descrição, botão
- Seção de estatísticas

### Usuarios.jsx
**Features:**
- Carrega dados reais do users.json via API
- Estado de loading enquanto busca dados
- Exibição de erro se houver falha
- Tabela com: Nome, E-mail, CPF, Telefone, Status, Ações
- Botão "+ Novo Usuário" para adicionar (ainda sem integração)
- Botões de editar e deletar
- Paginação automática para muitos usuários (não implementada ainda)

**Dados Exibidos:**
```javascript
{
  id: user.id,
  name: user.name || `${user.firstName} ${user.lastName}`,
  email: user.email,
  cpf: user.cpf || '-',
  phone: user.phone || '-',
  status: 'ativo'
}
```

### ProgressiveBar.jsx
**Features:**
- Demo de barra de progresso animada
- 3 velocidades: Lenta, Normal, Rápida
- Botões: Iniciar, Resetar
- 3 exemplos de uso:
  1. Progresso indeterminado
  2. Progresso com cores (warning, success)
  3. Multi-progresso

### ComingSoon.jsx
**Props:** `title`, `description`
**Uso:** Template reutilizável para módulos em desenvolvimento

---

## 🔗 API Endpoints

### Autenticação
```
POST /login
Request:  { email, password }
Response: { success, message, user }
```

### Usuários
```
GET /users
Response: [{ id, name, email, password, cpf, phone, ... }, ...]

POST /users
Request:  { firstName, lastName, email, password, ... }
Response: { success, message, user }

DELETE /users/:id
Response: { success, message, user }
```

---

## 📦 Serviços (userService.js)

### loginUser(email, password)
```javascript
→ Retorna: { success, message, user }
→ Chamada: POST /login
```

### createUser(userData)
```javascript
→ Retorna: { success, message, user }
→ Chamada: POST /users
→ Validação: firstName, lastName, email, password obrigatórios
```

### getAllUsers()
```javascript
→ Retorna: { success, users: Array, message }
→ Chamada: GET /users
→ Trata erros e retorna array vazio se falhar
```

### deleteUser(userId)
```javascript
→ Retorna: { success, message, user }
→ Chamada: DELETE /users/:id
```

---

## 🎨 Design e Estilos

### Cores Principais
```css
--primaria: #126d82    /* Azul petroleo */
--secundaria: #ebd544  /* Amarelo */
--sucesso: #59aa8a     /* Verde */
--perigo: #b42318      /* Vermelho */
--info: #8a92a0        /* Cinza */
--background: #f3f6f8  /* Cinza claro */
--border: #d9e2e8      /* Cinza borda */
--text: #1d2433        /* Preto */
```

### Componentes CSS
- `.app-shell` - Container principal auth
- `.dashboard-shell` - Container dashboard (sidebar + content)
- `.header` - Cabeçalho com hamburger
- `.sidebar` - Menu lateral
- `.page-container` - Conteúdo das páginas
- `.module-card` - Cards de módulos
- `.users-table` - Tabela de usuários
- `.pb-bar` - Barra de progresso

### Responsividade
- Desktop: Layout completo
- Tablet: Sidebar colapsada por padrão
- Mobile: Menu sanduíche ativo por padrão

---

## 👥 Usuários Padrão (users.json)

```json
[
  {
    "id": "1",
    "name": "Usuario QA",
    "email": "qa@teste.com",
    "password": "123456"
  },
  {
    "id": "99052fb5-3c8d-4934-a259-dcdb603d502e",
    "name": "andre luis",
    "firstName": "andre",
    "lastName": "luis",
    "email": "qa2@teste.com",
    "password": "Z5xu_6tBdmN7_Cj",
    "cpf": "090.909.090-90",
    "birthDate": "1991-09-09",
    "phone": "(00) 00000-9988",
    "gender": "masculino",
    "state": "PA",
    ...
  },
  {
    "id": "afb6b4b4-cf41-4a66-995d-42027913c956",
    "name": "João Silva",
    "firstName": "João",
    "lastName": "Silva",
    "email": "joao@teste.com",
    "password": "123456",
    "cpf": "123.456.789-01",
    "phone": "(11) 98765-4321",
    "state": "SP",
    ...
  }
]
```

---

## 🚀 Como Rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Terminal 1 - Frontend (Vite)
```bash
npm run dev
# ou
node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 3000
# Acessa: http://localhost:3000
```

### 3. Terminal 2 - Backend (API)
```bash
node server/api.js
# API rodando em: http://localhost:3001
```

### 4. Login (teste)
- Email: `joao@teste.com`
- Senha: `123456`

---

## ✅ Funcionalidades Implementadas

- [x] Tela de login/registro
- [x] Autenticação com validação
- [x] Menu sanduíche responsivo
- [x] Header com hamburger
- [x] Dashboard com módulos
- [x] Página de usuários com tabela
- [x] Carregamento de usuários do users.json
- [x] Deleção de usuários
- [x] Barra de progresso interativa
- [x] Design responsivo
- [x] Logout funcional
- [x] Estado de loading na tabela de usuários
- [x] Tratamento de erros na API

---

## 🔧 Próximas Implementações

### Curto Prazo
- [ ] Edição de usuários
- [ ] Criação de usuários via formulário
- [ ] Validações mais robustas
- [ ] Toast/notificações

### Médio Prazo
- [ ] Página de formulários
- [ ] Página de tabelas dinâmicas
- [ ] Página de alertas
- [ ] Paginação na tabela de usuários

### Longo Prazo
- [ ] Autenticação JWT
- [ ] Banco de dados real (MongoDB, PostgreSQL)
- [ ] Testes com Cypress
- [ ] CI/CD com GitHub Actions

---

## 🐛 Troubleshooting

### Erro: "A API ja esta rodando"
**Solução:** Feche o outro terminal com Ctrl+C ou use outra porta

### Erro: "Falha ao carregar usuários"
**Verificar:**
1. API está rodando? `node server/api.js`
2. URL correta? `http://localhost:3001`
3. users.json existe? `src/data/users.json`

### Login não funciona
**Verificar:**
1. Email e senha corretos (ver users.json)
2. Verificar console do navegador para erros
3. API respondendo? Check em http://localhost:3001/users

---

## 📝 Notas Importantes

1. **users.json é a fonte de verdade** - Não há banco de dados
2. **Reload da página volta ao login** - Estado não persiste
3. **API responde em localhost:3001** - Hardcoded no userService.js
4. **CSS é puro** - Sem bibliotecas UI (Tailwind, Material-UI, etc)
5. **React 19** - Usando hooks modernos

---

## 👨‍💻 Desenvolvedor

Projeto em desenvolvimento contínuo.
Última atualização: 2026-06-09
