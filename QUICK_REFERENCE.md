# QUICK REFERENCE - Testa aí QA

## 🚀 Start
```bash
# Terminal 1 - Frontend (porta 3000)
npm run dev

# Terminal 2 - API (porta 3001)
node server/api.js
```

## 🔑 Test Account
- Email: `joao@teste.com`
- Password: `123456`

## 📂 Key Files
| Arquivo | Responsabilidade |
|---------|------------------|
| `src/App.jsx` | Componente principal, roteamento |
| `src/pages/Usuarios.jsx` | Tabela de usuários (carrega do API) |
| `src/services/userService.js` | API client (login, users, delete) |
| `server/api.js` | Backend Node.js (GET/POST/DELETE) |
| `src/data/users.json` | Base de dados |
| `src/styles.css` | Estilos globais |

## 🎯 Current Page Routes
```javascript
'login'          // Tela de autenticação
'home'           // Dashboard com módulos
'usuarios'       // Tabela de usuários (ATIVA)
'progressive-bar' // Barra de progresso
'forms'          // Em breve
'tabelas'        // Em breve
'alerts'         // Em breve
```

## 🔌 API Endpoints
```
GET    /users              → Lista todos usuários
POST   /users              → Cria novo usuário
POST   /login              → Autentica
DELETE /users/:id          → Deleta usuário
```

## 📊 State Management (App.jsx)
```javascript
const [currentPage, setCurrentPage] = useState('login');
const [loggedUser, setLoggedUser] = useState(null);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [formMode, setFormMode] = useState('login');
```

## 🎨 Colors
- Primary: `#126d82`
- Secondary: `#ebd544`
- Success: `#59aa8a`
- Danger: `#b42318`
- Background: `#f3f6f8`

## 📦 Dependencies
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "vite": "^7.0.0"
}
```

## 🔄 User Loading Flow
1. `Usuarios.jsx` monta
2. `useEffect` chama `loadUsers()`
3. `getAllUsers()` faz `GET /users`
4. `api.js` lê `users.json`
5. Mapeia dados para formato de tabela
6. `setUsers()` atualiza estado

## ✨ Implemented Features
✅ Login/Register com validação
✅ Sidebar menu responsivo
✅ Tabela de usuários do users.json
✅ Delete user (integrado)
✅ Progressive bar demo
✅ Loading states
✅ Error handling

## 📝 Quick Tasks
- [ ] Edit user functionality
- [ ] Add user via form
- [ ] Toast notifications
- [ ] Pagination
- [ ] Forms page
- [ ] Tables page
- [ ] Alerts page

## 🐛 Common Issues
- **"API already running"** → Close other terminal
- **Can't load users** → Check if `node server/api.js` is running
- **Login fails** → Check users.json for email/password
- **Page goes to login on reload** → No state persistence (normal)

## 💡 Tips
1. Users stored in `src/data/users.json`
2. No database - all in memory + JSON file
3. Each users.json edit needs API restart
4. Test with browser devtools (F12)
5. All components use React hooks
