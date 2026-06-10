import React, { useState } from 'react';
import { createUser, loginUser } from './services/userService.js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Home from './pages/Home';
import Usuarios from './pages/Usuarios';
import ProgressiveBar from './pages/ProgressiveBar';
import ComingSoon from './pages/ComingSoon';

const APP_NAME = 'Testa ai QA - Plataforma de Test';
const BRAZIL_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapa' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceara' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espirito Santo' },
  { value: 'GO', label: 'Goias' },
  { value: 'MA', label: 'Maranhao' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Para' },
  { value: 'PB', label: 'Paraiba' },
  { value: 'PR', label: 'Parana' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piaui' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondonia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'Sao Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

const FIELD_LABELS = {
  firstName: 'Nome',
  lastName: 'Sobrenome',
  email: 'E-mail',
  password: 'Senha',
  cpf: 'CPF',
  birthDate: 'Data de nascimento',
  phone: 'Telefone',
  gender: 'Sexo',
  treatment: 'Forma de tratamento',
  zipCode: 'CEP',
  street: 'Rua',
  number: 'Numero',
  complement: 'Complemento',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'Estado',
  acceptTerms: 'Participacao nos fluxos de teste',
  receiveQaTips: 'Dicas de QA e automacao',
};

const REGISTER_REQUIRED_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'password',
  'cpf',
  'birthDate',
  'phone',
  'gender',
  'treatment',
  'zipCode',
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
  'acceptTerms',
  'receiveQaTips',
];

function onlyDigits(value) {
  return value.replace(/\D/g, '');
}

function formatCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function formatZipCode(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function formatPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 7) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2');
  }

  return digits.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

function limitBirthDateYear(value) {
  const [year, month, day] = value.split('-');

  if (!year || year.length <= 4) {
    return value;
  }

  return [year.slice(0, 4), month, day].filter(Boolean).join('-');
}

function buildRequiredMessage(fieldName) {
  return `${FIELD_LABELS[fieldName]} e obrigatorio.`;
}

function FieldError({ field, errors }) {
  if (!errors[field]) {
    return null;
  }

  return (
    <span className="field-error" data-testid={`${field}-error`}>
      {errors[field]}
    </span>
  );
}

function App() {
  const [formMode, setFormMode] = useState('login');
  const [currentPage, setCurrentPage] = useState('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    cpf: '',
    birthDate: '',
    phone: '',
    gender: '',
    callAsMr: false,
    callAsMrs: false,
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    acceptTerms: false,
    receiveQaTips: false,
  });
  const [feedback, setFeedback] = useState('');
  const [loggedUser, setLoggedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successModalUser, setSuccessModalUser] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const isRegisterMode = formMode === 'register';

  function handleChange(event) {
    const { checked, name, type, value } = event.target;
    let nextValue = value;

    if (name === 'cpf') {
      nextValue = formatCpf(value);
    }

    if (name === 'zipCode') {
      nextValue = formatZipCode(value);
    }

    if (name === 'phone') {
      nextValue = formatPhone(value);
    }

    if (name === 'birthDate') {
      nextValue = limitBirthDateYear(value);
    }

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === 'checkbox' ? checked : nextValue,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
      ...(name === 'callAsMr' || name === 'callAsMrs' ? { treatment: '' } : {}),
    }));
  }

  function handleModeChange(nextMode) {
    setFormMode(nextMode);
    setFeedback('');
    setLoggedUser(null);
    setSuccessModalUser(null);
    setFieldErrors({});
  }

  function resetForm() {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      cpf: '',
      birthDate: '',
      phone: '',
      gender: '',
      callAsMr: false,
      callAsMrs: false,
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      acceptTerms: false,
      receiveQaTips: false,
    });
  }

  function closeSuccessModal() {
    setSuccessModalUser(null);
  }

  function validateForm() {
    const nextErrors = {};

    if (!isRegisterMode) {
      if (!formData.email.trim()) {
        nextErrors.email = buildRequiredMessage('email');
      }

      if (!formData.password.trim()) {
        nextErrors.password = buildRequiredMessage('password');
      }

      return nextErrors;
    }

    REGISTER_REQUIRED_FIELDS.forEach((fieldName) => {
      if (fieldName === 'treatment') {
        if (!formData.callAsMr && !formData.callAsMrs) {
          nextErrors.treatment = buildRequiredMessage('treatment');
        }
        return;
      }

      if (fieldName === 'acceptTerms' || fieldName === 'receiveQaTips') {
        if (!formData[fieldName]) {
          nextErrors[fieldName] = buildRequiredMessage(fieldName);
        }
        return;
      }

      if (!String(formData[fieldName]).trim()) {
        nextErrors[fieldName] = buildRequiredMessage(fieldName);
      }
    });

    if (formData.cpf && onlyDigits(formData.cpf).length !== 11) {
      nextErrors.cpf = 'CPF deve ter 11 digitos.';
    }

    if (formData.phone) {
      const phoneLength = onlyDigits(formData.phone).length;

      if (phoneLength !== 10 && phoneLength !== 11) {
        nextErrors.phone = 'Telefone deve ter DDD e 8 ou 9 digitos.';
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback('');

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const result = isRegisterMode
        ? await createUser(formData)
        : await loginUser(formData.email, formData.password);

      if (!result.success) {
        setFeedback(result.message);
        return;
      }

      setLoggedUser(result.user);
      setFeedback(result.message);

      if (isRegisterMode) {
        setSuccessModalUser(result.user);
        setFormMode('login');
      } else {
        // Redireciona para home após login bem-sucedido
        setTimeout(() => {
          setCurrentPage('home');
        }, 500);
      }

      resetForm();
    } catch (error) {
      setFeedback('API indisponivel. Rode npm.cmd run api em outro terminal.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleNavigation(pageId) {
    if (pageId === 'logout') {
      setLoggedUser(null);
      setCurrentPage('login');
      setFeedback('');
      setFormMode('login');
      resetForm();
      return;
    }
    setCurrentPage(pageId);
  }

  function toggleSidebar() {
    setIsSidebarOpen(!isSidebarOpen);
  }

  function renderPageContent() {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'usuarios':
        return <Usuarios />;
      case 'progressive-bar':
        return <ProgressiveBar />;
      case 'forms':
        return <ComingSoon title="Formulários" description="Teste cenários com formulários interativos" />;
      case 'tabelas':
        return <ComingSoon title="Tabelas" description="Explore tabelas dinâmicas e filtros" />;
      case 'alerts':
        return <ComingSoon title="Alertas" description="Interaja com diferentes tipos de alertas" />;
      default:
        return <Home />;
    }
  }

  // Se não está autenticado, mostra tela de login/registro
  if (!loggedUser) {
      return (
        <main className="app-shell" data-testid="app-shell">
      <section className="auth-panel" data-testid="auth-panel">
        <div className="brand-area" data-testid="brand-area">
          <span className="brand-badge" data-testid="brand-badge">
            QA
          </span>
          <h1 data-testid="app-title">{APP_NAME}</h1>
          <p data-testid="app-subtitle">
            Aprenda fluxos de automacao com cenarios simples, rastreaveis e prontos para testes.
          </p>
        </div>

        <div className="mode-actions" data-testid="auth-mode-actions">
          <button
            className={!isRegisterMode ? 'active' : ''}
            type="button"
            onClick={() => handleModeChange('login')}
            data-testid="show-login-button"
          >
            Login
          </button>
          <button
            className={isRegisterMode ? 'active' : ''}
            type="button"
            onClick={() => handleModeChange('register')}
            data-testid="show-register-button"
          >
            Cadastro
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} data-testid="auth-form">
          {isRegisterMode && (
            <>
              <div className="form-grid" data-testid="personal-data-section">
                <label data-testid="first-name-field-label">
                  Nome
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    autoComplete="given-name"
                    data-testid="first-name-input"
                  />
                  <FieldError field="firstName" errors={fieldErrors} />
                </label>

                <label data-testid="last-name-field-label">
                  Sobrenome
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Seu sobrenome"
                    autoComplete="family-name"
                    data-testid="last-name-input"
                  />
                  <FieldError field="lastName" errors={fieldErrors} />
                </label>

                <label data-testid="cpf-field-label">
                  CPF
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    maxLength="14"
                    data-testid="cpf-input"
                  />
                  <FieldError field="cpf" errors={fieldErrors} />
                </label>

                <label data-testid="birth-date-field-label">
                  Data de nascimento
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    min="1900-01-01"
                    max="9999-12-31"
                    data-testid="birth-date-input"
                  />
                  <FieldError field="birthDate" errors={fieldErrors} />
                </label>

                <label data-testid="phone-field-label">
                  Telefone
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    maxLength="15"
                    autoComplete="tel"
                    data-testid="phone-input"
                  />
                  <FieldError field="phone" errors={fieldErrors} />
                </label>
              </div>

              <fieldset className="choice-group" data-testid="gender-fieldset">
                <legend data-testid="gender-legend">Sexo</legend>
                <label className="choice-option" data-testid="gender-female-label">
                  <input
                    type="radio"
                    name="gender"
                    value="feminino"
                    checked={formData.gender === 'feminino'}
                    onChange={handleChange}
                    data-testid="gender-female-radio"
                  />
                  Feminino
                </label>
                <label className="choice-option" data-testid="gender-male-label">
                  <input
                    type="radio"
                    name="gender"
                    value="masculino"
                    checked={formData.gender === 'masculino'}
                    onChange={handleChange}
                    data-testid="gender-male-radio"
                  />
                  Masculino
                </label>
                <label className="choice-option" data-testid="gender-other-label">
                  <input
                    type="radio"
                    name="gender"
                    value="outro"
                    checked={formData.gender === 'outro'}
                    onChange={handleChange}
                    data-testid="gender-other-radio"
                  />
                  Outro
                </label>
                <FieldError field="gender" errors={fieldErrors} />
              </fieldset>

              <fieldset className="choice-group" data-testid="treatment-fieldset">
                <legend data-testid="treatment-legend">Forma de tratamento</legend>
                <label className="choice-option" data-testid="call-as-mr-label">
                  <input
                    type="checkbox"
                    name="callAsMr"
                    checked={formData.callAsMr}
                    onChange={handleChange}
                    data-testid="call-as-mr-checkbox"
                  />
                  Quero ser chamado de Sr.
                </label>
                <label className="choice-option" data-testid="call-as-mrs-label">
                  <input
                    type="checkbox"
                    name="callAsMrs"
                    checked={formData.callAsMrs}
                    onChange={handleChange}
                    data-testid="call-as-mrs-checkbox"
                  />
                  Quero ser chamada de Senhora
                </label>
                <FieldError field="treatment" errors={fieldErrors} />
              </fieldset>

              <div className="section-title" data-testid="address-section-title">
                Endereco completo
              </div>

              <div className="form-grid" data-testid="address-data-section">
                <label data-testid="zip-code-field-label">
                  CEP
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="00000-000"
                    maxLength="9"
                    autoComplete="postal-code"
                    data-testid="zip-code-input"
                  />
                  <FieldError field="zipCode" errors={fieldErrors} />
                </label>

                <label className="span-two" data-testid="street-field-label">
                  Rua
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="Nome da rua"
                    autoComplete="address-line1"
                    data-testid="street-input"
                  />
                  <FieldError field="street" errors={fieldErrors} />
                </label>

                <label data-testid="number-field-label">
                  Numero
                  <input
                    type="text"
                    name="number"
                    value={formData.number}
                    onChange={handleChange}
                    placeholder="123"
                    data-testid="number-input"
                  />
                  <FieldError field="number" errors={fieldErrors} />
                </label>

                <label data-testid="complement-field-label">
                  Complemento
                  <input
                    type="text"
                    name="complement"
                    value={formData.complement}
                    onChange={handleChange}
                    placeholder="Apto, bloco"
                    autoComplete="address-line2"
                    data-testid="complement-input"
                  />
                  <FieldError field="complement" errors={fieldErrors} />
                </label>

                <label data-testid="neighborhood-field-label">
                  Bairro
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    placeholder="Seu bairro"
                    data-testid="neighborhood-input"
                  />
                  <FieldError field="neighborhood" errors={fieldErrors} />
                </label>

                <label data-testid="city-field-label">
                  Cidade
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Sua cidade"
                    autoComplete="address-level2"
                    data-testid="city-input"
                  />
                  <FieldError field="city" errors={fieldErrors} />
                </label>

                <label data-testid="state-field-label">
                  Estado
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    autoComplete="address-level1"
                    data-testid="state-select"
                  >
                    <option value="" data-testid="state-option-empty">
                      Selecione o estado
                    </option>
                    {BRAZIL_STATES.map((state) => (
                      <option
                        key={state.value}
                        value={state.value}
                        data-testid={`state-option-${state.value.toLowerCase()}`}
                      >
                        {state.label}
                      </option>
                    ))}
                  </select>
                  <FieldError field="state" errors={fieldErrors} />
                </label>
              </div>

              <fieldset className="choice-group" data-testid="preferences-fieldset">
                <legend data-testid="preferences-legend">Preferencias</legend>
                <label className="choice-option" data-testid="terms-label">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    data-testid="accept-terms-checkbox"
                  />
                  Aceito participar dos fluxos de teste da plataforma
                </label>
                <FieldError field="acceptTerms" errors={fieldErrors} />
                <label className="choice-option" data-testid="qa-tips-label">
                  <input
                    type="checkbox"
                    name="receiveQaTips"
                    checked={formData.receiveQaTips}
                    onChange={handleChange}
                    data-testid="receive-qa-tips-checkbox"
                  />
                  Quero receber dicas de QA e automacao
                </label>
                <FieldError field="receiveQaTips" errors={fieldErrors} />
              </fieldset>
            </>
          )}

          <label data-testid="email-field-label">
            E-mail
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="qa@teste.com"
              autoComplete="email"
              data-testid="email-input"
            />
            <FieldError field="email" errors={fieldErrors} />
          </label>

          <label data-testid="password-field-label">
            Senha
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Digite sua senha"
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              data-testid="password-input"
            />
            <FieldError field="password" errors={fieldErrors} />
          </label>

          <button
            className="primary-action"
            type="submit"
            disabled={isLoading}
            data-testid="submit-auth-button"
          >
            {isLoading ? 'Aguarde...' : isRegisterMode ? 'Criar usuario' : 'Entrar'}
          </button>
        </form>

        {feedback && (
          <p className="feedback-message" data-testid="feedback-message">
            {feedback}
          </p>
        )}

        {loggedUser && (
          <div className="logged-user" data-testid="logged-user-card">
            <strong data-testid="logged-user-title">Usuario autenticado</strong>
            <span data-testid="logged-user-name">{loggedUser.name}</span>
            <span data-testid="logged-user-email">{loggedUser.email}</span>
          </div>
        )}
      </section>

      {successModalUser && (
        <div className="modal-backdrop" role="presentation" data-testid="success-modal-backdrop">
          <section
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
            data-testid="success-modal"
          >
            <h2 id="success-modal-title" data-testid="success-modal-title">
              Cadastro realizado com sucesso
            </h2>
            <p data-testid="success-modal-message">
              Usuario {successModalUser.name} criado no arquivo users.json.
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={closeSuccessModal}
              data-testid="close-success-modal-button"
            >
              Entendi
            </button>
          </section>
        </div>
      )}
    </main>
    );
  }

  // Se está autenticado, mostra dashboard com sidebar
  return (
    <div className="dashboard-shell" data-testid="dashboard-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigation}
        currentUser={loggedUser}
      />
      <div className="dashboard-content">
        <Header
          onMenuToggle={toggleSidebar}
          currentUser={loggedUser}
        />
        <main className="page-container" data-testid="page-container">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
