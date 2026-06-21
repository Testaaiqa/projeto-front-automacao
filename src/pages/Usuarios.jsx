import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, updateUser, toggleUserStatus } from '../services/userService.js';

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 6) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2');
  }

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  }

  return digits.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

function validateUserForm(formData) {
  const errors = {};

  if (!formData.name.trim()) {
    errors.name = 'Nome é obrigatório.';
  }

  if (!formData.email.trim()) {
    errors.email = 'E-mail é obrigatório.';
  }

  if (formData.cpf && onlyDigits(formData.cpf).length !== 11) {
    errors.cpf = 'CPF deve ter 11 dígitos.';
  }

  if (formData.phone) {
    const phoneLength = onlyDigits(formData.phone).length;

    if (phoneLength !== 10 && phoneLength !== 11) {
      errors.phone = 'Telefone deve ter DDD e 8 ou 9 dígitos.';
    }
  }

  return errors;
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <span className="field-error">{message}</span>;
}

function Usuarios() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    firstName: '',
    lastName: '',
  });

  // Carrega usuários ao montar o componente
  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    setError('');
    const result = await getAllUsers();
    if (result.success) {
      // Mapeia os dados para formato da tabela
      const mappedUsers = result.users.map((user) => ({
        id: user.id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        cpf: user.cpf || '-',
        phone: user.phone || '-',
        status: user.status || 'ativo',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        ...user, // Mantém todos os dados originais
      }));
      setUsers(mappedUsers);
    } else {
      setError(result.message);
      setUsers([]);
    }
    setIsLoading(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'cpf') {
      nextValue = formatCpf(value);
    }

    if (name === 'phone') {
      nextValue = formatPhone(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      cpf: user.cpf === '-' ? '' : formatCpf(user.cpf),
      phone: user.phone === '-' ? '' : formatPhone(user.phone),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
    setFieldErrors({});
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      firstName: '',
      lastName: '',
    });
    setFieldErrors({});
    setShowForm(false);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ativo' ? 'inativo' : 'ativo';
    const result = await toggleUserStatus(user.id, newStatus);
    if (result.success) {
      setUsers(
        users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                status: newStatus,
              }
            : u,
        ),
      );
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationErrors = validateUserForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    if (editingUser) {
      // Modo edição
      const updateData = {
        name: formData.name || `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        cpf: formData.cpf || undefined,
        phone: formData.phone || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      };

      const result = await updateUser(editingUser.id, updateData);
      if (result.success) {
        // Atualiza o usuário na lista
        setUsers(
          users.map((user) =>
            user.id === editingUser.id
              ? {
                  ...user,
                  ...result.user,
                  name: result.user.name || `${result.user.firstName} ${result.user.lastName}`.trim(),
                  cpf: result.user.cpf || '-',
                  phone: result.user.phone || '-',
                }
              : user,
          ),
        );
        handleCancelEdit();
      } else {
        setError(result.message);
      }
    } else {
      // Modo novo usuário
      const newUser = {
        id: Date.now().toString(),
        ...formData,
        status: 'ativo',
      };
      setUsers([...users, newUser]);
      setFormData({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        firstName: '',
        lastName: '',
      });
      setShowForm(false);
    }
  };

  const handleDelete = async () => {
    const userId = showDeleteConfirm;
    const result = await deleteUser(userId);
    if (result.success || result.message) {
      setUsers(users.filter((user) => user.id !== userId));
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="usuarios-page" data-testid="usuarios-page">
      <div className="page-header">
        <h2 data-testid="usuarios-title">Gerenciamento de Usuários</h2>
        {!showForm && (
          <button
            className="primary-action"
            onClick={() => {
              setEditingUser(null);
              setFormData({
                name: '',
                email: '',
                cpf: '',
                phone: '',
                firstName: '',
                lastName: '',
              });
              setFieldErrors({});
              setShowForm(true);
            }}
            data-testid="add-user-btn"
          >
            + Novo Usuário
          </button>
        )}
      </div>

      {error && (
        <div className="error-message" data-testid="usuarios-error">
          {error}
          <button
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {showForm && (
        <div className="form-container" data-testid="user-form-container">
          <form onSubmit={handleSubmit} data-testid="user-form">
            <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <div className="form-grid">
              <label data-testid="user-name-label">
                Nome
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  required
                  data-testid="user-name-input"
                />
                <FieldError message={fieldErrors.name} />
              </label>

              <label data-testid="user-email-label">
                E-mail
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@teste.com"
                  required
                  data-testid="user-email-input"
                />
                <FieldError message={fieldErrors.email} />
              </label>

              <label data-testid="user-cpf-label">
                CPF
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  maxLength="14"
                  inputMode="numeric"
                  pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                  data-testid="user-cpf-input"
                />
                <FieldError message={fieldErrors.cpf} />
              </label>

              <label data-testid="user-phone-label">
                Telefone
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  maxLength="15"
                  inputMode="tel"
                  pattern="\(\d{2}\) \d{4,5}-\d{4}"
                  data-testid="user-phone-input"
                />
                <FieldError message={fieldErrors.phone} />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-action" data-testid="save-user-btn">
                {editingUser ? 'Atualizar Usuário' : 'Salvar Usuário'}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={handleCancelEdit}
                data-testid="cancel-user-btn"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" data-testid="delete-confirm-modal">
          <div className="modal-content">
            <h3>Confirmar Deleção</h3>
            <p>Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.</p>
            <div className="modal-actions">
              <button className="danger-action" onClick={handleDelete} data-testid="confirm-delete-btn">
                Deletar
              </button>
              <button
                className="secondary-action"
                onClick={() => setShowDeleteConfirm(null)}
                data-testid="cancel-delete-btn"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading-container" data-testid="usuarios-loading">
          <p>Carregando usuários...</p>
        </div>
      ) : (
        <div className="table-container" data-testid="usuarios-table-container">
          <table className="users-table" data-testid="usuarios-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} data-testid={`user-row-${user.id}`}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.cpf}</td>
                    <td>{user.phone}</td>
                    <td>
                      <span
                        className={`status-badge ${user.status}`}
                        onClick={() => handleToggleStatus(user)}
                        style={{ cursor: 'pointer' }}
                        data-testid={`user-status-${user.id}`}
                        title="Clique para alterar status"
                      >
                        {user.status === 'ativo' ? '✓ Ativo' : '✕ Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(user)}
                          data-testid={`edit-user-btn-${user.id}`}
                          title="Editar usuário"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => setShowDeleteConfirm(user.id)}
                          data-testid={`delete-user-btn-${user.id}`}
                          title="Deletar usuário"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
