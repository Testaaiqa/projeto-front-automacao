export function validateRegisterPayload(userData = {}) {
  const missingFields = [];

  const required = [
    ['firstName', 'Nome'],
    ['lastName', 'Sobrenome'],
    ['email', 'E-mail'],
    ['password', 'Senha'],
    ['cpf', 'CPF'],
    ['birthDate', 'Data de nascimento'],
    ['phone', 'Telefone'],
    ['gender', 'Sexo'],
    ['zipCode', 'CEP'],
    ['street', 'Rua'],
    ['number', 'Número'],
    ['complement', 'Complemento'],
    ['neighborhood', 'Bairro'],
    ['city', 'Cidade'],
    ['state', 'Estado'],
  ];

  for (const [fieldName, label] of required) {
    if (!String(userData[fieldName] || '').trim()) {
      missingFields.push(label);
    }
  }

  if (!userData.treatment) {
    missingFields.push('Forma de tratamento');
  }

  if (userData.treatment === 'outro' && !String(userData.treatmentOtherText || '').trim()) {
    missingFields.push('Outro tratamento');
  }

  if (!userData.acceptTerms) {
    missingFields.push('Aceite participar dos fluxos de teste da plataforma');
  }

  return missingFields;
}

export function validateRegistrationForm(formData = {}) {
  const nextErrors = {};

  const missingFields = validateRegisterPayload(formData);
  if (missingFields.length > 0) {
    const fieldMap = {
      'Nome': 'firstName',
      'Sobrenome': 'lastName',
      'E-mail': 'email',
      'Senha': 'password',
      'CPF': 'cpf',
      'Data de nascimento': 'birthDate',
      'Telefone': 'phone',
      'Sexo': 'gender',
      'Forma de tratamento': 'treatment',
      'Outro tratamento': 'treatmentOtherText',
      'CEP': 'zipCode',
      'Rua': 'street',
      'Número': 'number',
      'Complemento': 'complement',
      'Bairro': 'neighborhood',
      'Cidade': 'city',
      'Estado': 'state',
      'Aceite participar dos fluxos de teste da plataforma': 'acceptTerms',
    };

    for (const fieldLabel of missingFields) {
      const fieldName = fieldMap[fieldLabel];
      if (fieldName === 'acceptTerms') {
        nextErrors.acceptTerms = 'Você precisa aceitar os termos para cadastrar.';
      } else if (fieldName) {
        nextErrors[fieldName] = `${fieldLabel} é obrigatório.`;
      }
    }
  }

  if (formData.cpf && String(formData.cpf).replace(/\D/g, '').length !== 11) {
    nextErrors.cpf = 'CPF deve ter 11 dígitos.';
  }

  if (formData.phone) {
    const digits = String(formData.phone).replace(/\D/g, '');
    if (digits.length !== 10 && digits.length !== 11) {
      nextErrors.phone = 'Telefone deve ter DDD e 8 ou 9 dígitos.';
    }
  }

  return nextErrors;
}
