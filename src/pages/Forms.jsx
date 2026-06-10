import React, { useMemo, useState } from 'react';

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

  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  }

  return digits.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

function formatZipCode(value) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

function formatCardNumber(value) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function FieldError({ message, testId }) {
  if (!message) {
    return null;
  }

  return (
    <span className="field-error" data-testid={testId}>
      {message}
    </span>
  );
}

const initialCustomer = {
  fullName: '',
  email: '',
  cpf: '',
  phone: '',
  birthDate: '',
  company: '',
  companySize: '',
  role: '',
  plan: 'starter',
  terms: false,
};

const initialAddress = {
  zipCode: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
};

const initialCheckout = {
  product: 'automation-suite',
  quantity: 1,
  coupon: '',
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
  installments: '1',
  invoice: true,
};

function Forms() {
  const [customer, setCustomer] = useState(initialCustomer);
  const [address, setAddress] = useState(initialAddress);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [submission, setSubmission] = useState(null);
  const [flags, setFlags] = useState({
    newsletter: true,
    twoFactor: false,
    prioritySupport: false,
  });

  const unitPrice = checkout.product === 'enterprise-lab' ? 349 : checkout.product === 'api-pack' ? 189 : 129;
  const discount = checkout.coupon.trim().toUpperCase() === 'QA10' ? 0.1 : 0;
  const subtotal = unitPrice * Number(checkout.quantity);
  const total = useMemo(() => subtotal - subtotal * discount, [discount, subtotal]);

  function updateCustomer(event) {
    const { checked, name, type, value } = event.target;
    let nextValue = value;

    if (name === 'cpf') {
      nextValue = formatCpf(value);
    }

    if (name === 'phone') {
      nextValue = formatPhone(value);
    }

    setCustomer((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : nextValue,
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function updateAddress(event) {
    const { name, value } = event.target;
    setAddress((current) => ({
      ...current,
      [name]: name === 'zipCode' ? formatZipCode(value) : value,
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function updateCheckout(event) {
    const { checked, name, type, value } = event.target;
    let nextValue = value;

    if (name === 'cardNumber') {
      nextValue = formatCardNumber(value);
    }

    if (name === 'cvv') {
      nextValue = onlyDigits(value).slice(0, 4);
    }

    if (name === 'expiry') {
      nextValue = onlyDigits(value)
        .slice(0, 4)
        .replace(/^(\d{2})(\d)/, '$1/$2');
    }

    setCheckout((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : nextValue,
    }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function updateFlag(event) {
    const { checked, name } = event.target;
    setFlags((current) => ({
      ...current,
      [name]: checked,
    }));
  }

  function lookupZipCode() {
    if (onlyDigits(address.zipCode).length !== 8) {
      setErrors((current) => ({ ...current, zipCode: 'CEP deve ter 8 digitos.' }));
      return;
    }

    setAddress((current) => ({
      ...current,
      street: 'Avenida dos Testes',
      neighborhood: 'Centro QA',
      city: 'Sao Paulo',
      state: 'SP',
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!customer.fullName.trim()) nextErrors.fullName = 'Nome completo e obrigatorio.';
    if (!customer.email.includes('@')) nextErrors.email = 'Informe um e-mail valido.';
    if (onlyDigits(customer.cpf).length !== 11) nextErrors.cpf = 'CPF deve ter 11 digitos.';
    if (![10, 11].includes(onlyDigits(customer.phone).length)) {
      nextErrors.phone = 'Telefone deve ter DDD e 8 ou 9 digitos.';
    }
    if (!customer.birthDate) nextErrors.birthDate = 'Data de nascimento e obrigatoria.';
    if (!customer.company.trim()) nextErrors.company = 'Empresa e obrigatoria.';
    if (!customer.companySize) nextErrors.companySize = 'Selecione o porte da empresa.';
    if (!customer.role) nextErrors.role = 'Selecione o perfil de acesso.';
    if (!customer.terms) nextErrors.terms = 'Aceite os termos para continuar.';
    if (onlyDigits(address.zipCode).length !== 8) nextErrors.zipCode = 'CEP deve ter 8 digitos.';
    if (!address.number.trim()) nextErrors.number = 'Numero e obrigatorio.';
    if (!checkout.cardName.trim()) nextErrors.cardName = 'Nome no cartao e obrigatorio.';
    if (onlyDigits(checkout.cardNumber).length !== 16) nextErrors.cardNumber = 'Cartao deve ter 16 digitos.';
    if (onlyDigits(checkout.expiry).length !== 4) nextErrors.expiry = 'Validade deve estar em MM/AA.';
    if (![3, 4].includes(onlyDigits(checkout.cvv).length)) nextErrors.cvv = 'CVV deve ter 3 ou 4 digitos.';
    if (!fileName) nextErrors.evidence = 'Anexe uma evidencia para o fluxo.';

    return nextErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmission(null);
      return;
    }

    setSubmission({
      customer: customer.fullName,
      plan: customer.plan,
      city: address.city,
      total: total.toFixed(2),
      fileName,
      enabledFlags: Object.entries(flags)
        .filter(([, enabled]) => enabled)
        .map(([name]) => name),
    });
  }

  function resetForm() {
    setCustomer(initialCustomer);
    setAddress(initialAddress);
    setCheckout(initialCheckout);
    setFlags({
      newsletter: true,
      twoFactor: false,
      prioritySupport: false,
    });
    setFileName('');
    setErrors({});
    setSubmission(null);
  }

  return (
    <div className="forms-page" data-testid="forms-page">
      <div className="page-header">
        <div>
          <h2 data-testid="forms-title">Formularios</h2>
          <p className="page-description">Fluxos ricos para validar campos, regras, estados e payloads.</p>
        </div>
      </div>

      <form className="market-form" onSubmit={handleSubmit} data-testid="market-form">
        <section className="form-lab-section">
          <div className="form-lab-heading">
            <h3>Cadastro B2B</h3>
            <span>Lead qualificado</span>
          </div>
          <div className="form-grid">
            <label>
              Nome completo
              <input
                name="fullName"
                value={customer.fullName}
                onChange={updateCustomer}
                placeholder="Maria Souza"
                data-testid="forms-full-name-input"
              />
              <FieldError message={errors.fullName} testId="forms-full-name-error" />
            </label>
            <label>
              E-mail corporativo
              <input
                name="email"
                value={customer.email}
                onChange={updateCustomer}
                placeholder="maria@empresa.com"
                data-testid="forms-email-input"
              />
              <FieldError message={errors.email} testId="forms-email-error" />
            </label>
            <label>
              CPF
              <input
                name="cpf"
                value={customer.cpf}
                onChange={updateCustomer}
                placeholder="000.000.000-00"
                maxLength="14"
                data-testid="forms-cpf-input"
              />
              <FieldError message={errors.cpf} testId="forms-cpf-error" />
            </label>
            <label>
              Telefone
              <input
                name="phone"
                value={customer.phone}
                onChange={updateCustomer}
                placeholder="(11) 99999-9999"
                maxLength="15"
                data-testid="forms-phone-input"
              />
              <FieldError message={errors.phone} testId="forms-phone-error" />
            </label>
            <label>
              Data de nascimento
              <input
                type="date"
                name="birthDate"
                value={customer.birthDate}
                onChange={updateCustomer}
                data-testid="forms-birth-date-input"
              />
              <FieldError message={errors.birthDate} testId="forms-birth-date-error" />
            </label>
            <label>
              Empresa
              <input
                name="company"
                value={customer.company}
                onChange={updateCustomer}
                placeholder="Acme QA"
                data-testid="forms-company-input"
              />
              <FieldError message={errors.company} testId="forms-company-error" />
            </label>
            <label>
              Porte
              <select
                name="companySize"
                value={customer.companySize}
                onChange={updateCustomer}
                data-testid="forms-company-size-select"
              >
                <option value="">Selecione</option>
                <option value="small">1 a 50 pessoas</option>
                <option value="mid">51 a 500 pessoas</option>
                <option value="enterprise">Acima de 500 pessoas</option>
              </select>
              <FieldError message={errors.companySize} testId="forms-company-size-error" />
            </label>
            <label>
              Perfil
              <select name="role" value={customer.role} onChange={updateCustomer} data-testid="forms-role-select">
                <option value="">Selecione</option>
                <option value="qa">QA</option>
                <option value="dev">Dev</option>
                <option value="product">Produto</option>
                <option value="manager">Gestao</option>
              </select>
              <FieldError message={errors.role} testId="forms-role-error" />
            </label>
          </div>

          <fieldset className="choice-group">
            <legend>Plano</legend>
            {['starter', 'growth', 'enterprise'].map((plan) => (
              <label className="choice-option" key={plan}>
                <input
                  type="radio"
                  name="plan"
                  value={plan}
                  checked={customer.plan === plan}
                  onChange={updateCustomer}
                  data-testid={`forms-plan-${plan}`}
                />
                {plan}
              </label>
            ))}
          </fieldset>
        </section>

        <section className="form-lab-section">
          <div className="form-lab-heading">
            <h3>Endereco com CEP</h3>
            <button type="button" className="secondary-action" onClick={lookupZipCode} data-testid="lookup-cep-btn">
              Buscar CEP
            </button>
          </div>
          <div className="form-grid">
            <label>
              CEP
              <input
                name="zipCode"
                value={address.zipCode}
                onChange={updateAddress}
                placeholder="00000-000"
                maxLength="9"
                data-testid="forms-zip-code-input"
              />
              <FieldError message={errors.zipCode} testId="forms-zip-code-error" />
            </label>
            <label>
              Rua
              <input name="street" value={address.street} onChange={updateAddress} data-testid="forms-street-input" />
            </label>
            <label>
              Numero
              <input name="number" value={address.number} onChange={updateAddress} data-testid="forms-number-input" />
              <FieldError message={errors.number} testId="forms-number-error" />
            </label>
            <label>
              Bairro
              <input
                name="neighborhood"
                value={address.neighborhood}
                onChange={updateAddress}
                data-testid="forms-neighborhood-input"
              />
            </label>
            <label>
              Cidade
              <input name="city" value={address.city} onChange={updateAddress} data-testid="forms-city-input" />
            </label>
            <label>
              UF
              <input name="state" value={address.state} onChange={updateAddress} maxLength="2" data-testid="forms-state-input" />
            </label>
          </div>
        </section>

        <section className="form-lab-section">
          <div className="form-lab-heading">
            <h3>Checkout</h3>
            <span data-testid="forms-total-value">R$ {total.toFixed(2)}</span>
          </div>
          <div className="form-grid">
            <label>
              Produto
              <select name="product" value={checkout.product} onChange={updateCheckout} data-testid="forms-product-select">
                <option value="automation-suite">Automation Suite</option>
                <option value="api-pack">API Test Pack</option>
                <option value="enterprise-lab">Enterprise Lab</option>
              </select>
            </label>
            <label>
              Quantidade
              <input
                type="number"
                name="quantity"
                min="1"
                max="20"
                value={checkout.quantity}
                onChange={updateCheckout}
                data-testid="forms-quantity-input"
              />
            </label>
            <label>
              Cupom
              <input name="coupon" value={checkout.coupon} onChange={updateCheckout} placeholder="QA10" data-testid="forms-coupon-input" />
            </label>
            <label>
              Nome no cartao
              <input name="cardName" value={checkout.cardName} onChange={updateCheckout} data-testid="forms-card-name-input" />
              <FieldError message={errors.cardName} testId="forms-card-name-error" />
            </label>
            <label>
              Numero do cartao
              <input
                name="cardNumber"
                value={checkout.cardNumber}
                onChange={updateCheckout}
                placeholder="0000 0000 0000 0000"
                maxLength="19"
                data-testid="forms-card-number-input"
              />
              <FieldError message={errors.cardNumber} testId="forms-card-number-error" />
            </label>
            <label>
              Validade
              <input name="expiry" value={checkout.expiry} onChange={updateCheckout} placeholder="MM/AA" maxLength="5" data-testid="forms-expiry-input" />
              <FieldError message={errors.expiry} testId="forms-expiry-error" />
            </label>
            <label>
              CVV
              <input name="cvv" value={checkout.cvv} onChange={updateCheckout} maxLength="4" data-testid="forms-cvv-input" />
              <FieldError message={errors.cvv} testId="forms-cvv-error" />
            </label>
            <label>
              Parcelas
              <select name="installments" value={checkout.installments} onChange={updateCheckout} data-testid="forms-installments-select">
                <option value="1">1x sem juros</option>
                <option value="3">3x sem juros</option>
                <option value="6">6x sem juros</option>
              </select>
            </label>
          </div>
        </section>

        <section className="form-lab-section">
          <div className="form-lab-heading">
            <h3>Evidencias e preferencias</h3>
          </div>
          <div className="form-extras-grid">
            <label className="file-drop">
              <span>{fileName || 'Selecionar evidencia'}</span>
              <input
                type="file"
                onChange={(event) => {
                  setFileName(event.target.files?.[0]?.name || '');
                  setErrors((current) => ({ ...current, evidence: '' }));
                }}
                data-testid="forms-file-input"
              />
              <FieldError message={errors.evidence} testId="forms-file-error" />
            </label>
            <div className="toggle-stack">
              <label className="choice-option">
                <input name="newsletter" type="checkbox" checked={flags.newsletter} onChange={updateFlag} data-testid="forms-newsletter-checkbox" />
                Receber novidades
              </label>
              <label className="choice-option">
                <input name="twoFactor" type="checkbox" checked={flags.twoFactor} onChange={updateFlag} data-testid="forms-2fa-checkbox" />
                Ativar 2FA
              </label>
              <label className="choice-option">
                <input
                  name="prioritySupport"
                  type="checkbox"
                  checked={flags.prioritySupport}
                  onChange={updateFlag}
                  data-testid="forms-priority-support-checkbox"
                />
                Suporte prioritario
              </label>
              <label className="choice-option">
                <input name="terms" type="checkbox" checked={customer.terms} onChange={updateCustomer} data-testid="forms-terms-checkbox" />
                Aceito os termos
              </label>
              <FieldError message={errors.terms} testId="forms-terms-error" />
            </div>
          </div>
        </section>

        <div className="form-lab-actions">
          <button type="submit" className="primary-action" data-testid="forms-submit-btn">
            Enviar fluxo
          </button>
          <button type="button" className="secondary-action" onClick={resetForm} data-testid="forms-reset-btn">
            Limpar
          </button>
        </div>
      </form>

      {submission && (
        <section className="form-result-panel" data-testid="forms-result-panel">
          <h3>Fluxo aprovado</h3>
          <p data-testid="forms-result-summary">
            {submission.customer} contratou {submission.plan} em {submission.city || 'cidade nao informada'} por R$ {submission.total}.
          </p>
          <div className="result-tags">
            <span>{submission.fileName}</span>
            {submission.enabledFlags.map((flag) => (
              <span key={flag}>{flag}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Forms;
