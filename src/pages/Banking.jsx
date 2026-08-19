import React, { useEffect, useState } from 'react';
import { depositMoney, getBankAccount, requestCreditAnalysis, transferMoney } from '../services/userService.js';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function parseMoneyInput(value) {
  const normalized = String(value).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
  return Number(normalized) || 0;
}

function formatMoneyInput(value, maxValue = Number.MAX_SAFE_INTEGER) {
  const rawValue = String(value).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  if (!rawValue) return '';

  const numericValue = Math.min(Number(rawValue) || 0, maxValue);
  return currency.format(numericValue);
}

function handleMoneyChange(setValue, value, maxValue = Number.MAX_SAFE_INTEGER) {
  const digits = value.replace(/\D/g, '');
  const numericValue = /R\$|,/.test(value) ? Number(digits) / 100 : Number(digits);
  const limitedValue = Math.min(numericValue || 0, maxValue);
  const integerDigits = String(Math.floor(limitedValue)).slice(0, 9);
  const finalValue = Number(`${integerDigits || '0'}.${String(Math.round(limitedValue * 100) % 100).padStart(2, '0')}`);
  setValue(finalValue ? currency.format(finalValue) : '');
}

function handleUnauthorized(result) {
  if (result.message?.includes('Token')) {
    window.dispatchEvent(new Event('auth-expired'));
    return true;
  }
  return false;
}

function Banking() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [requestedLimit, setRequestedLimit] = useState(formatMoneyInput('1000', 10000));
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function loadAccount() {
    setIsLoading(true);
    setError('');
    try {
      const result = await getBankAccount();
      if (!result.success) {
        handleUnauthorized(result);
        setError(result.message || 'Não foi possível carregar a conta.');
        return;
      }
      setAccount(result.account);
      setTransactions(result.transactions || []);
    } catch (loadError) {
      setError('API indisponível. Verifique se o servidor está rodando.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  async function handleTransfer(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');
    setError('');
    try {
      const result = await transferMoney(recipientEmail, parseMoneyInput(amount));
      if (!result.success) {
        handleUnauthorized(result);
        setError(result.message);
        return;
      }
      setFeedback(result.message);
      setRecipientEmail('');
      setAmount('');
      await loadAccount();
    } catch (transferError) {
      setError('Não foi possível realizar a transferência.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeposit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback('');
    setError('');
    try {
      const result = await depositMoney(parseMoneyInput(depositAmount));
      if (!result.success) {
        handleUnauthorized(result);
        setError(result.message);
        return;
      }
      setFeedback(result.message);
      setDepositAmount('');
      await loadAccount();
    } catch (depositError) {
      setError('Não foi possível adicionar saldo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreditAnalysis(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setIsAnalyzing(true);
    setFeedback('');
    setError('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const result = await requestCreditAnalysis(parseMoneyInput(requestedLimit));
      if (!result.success) {
        handleUnauthorized(result);
        setError(result.message);
        return;
      }
      setFeedback(`${result.message} Score da análise: ${result.analysis.score}. O saldo disponível não foi alterado.`);
      setRequestedLimit(formatMoneyInput('1000', 10000));
      await loadAccount();
    } catch (analysisError) {
      setError('Não foi possível concluir a análise de crédito.');
    } finally {
      setIsAnalyzing(false);
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="loading-container" data-testid="banking-loading">Carregando conta...</div>;
  }

  return (
    <div className="banking-page" data-testid="banking-page">
      <header className="page-header">
        <div>
          <span className="banking-eyebrow">Banco QA</span>
          <h2>Fluxos bancários</h2>
        </div>
        <button className="secondary-action" type="button" onClick={loadAccount} data-testid="banking-refresh">
          Atualizar saldo
        </button>
      </header>

      {error && <p className="error-message" role="alert" data-testid="banking-error">{error}</p>}
      {feedback && <p className="success-message" role="status" data-testid="banking-feedback">{feedback}</p>}

      <section className="banking-balance" data-testid="banking-balance-card">
        <div>
          <span>Saldo disponível</span>
          <strong>{currency.format(Number(account?.balance || 0))}</strong>
        </div>
        <div>
          <span>Limite de crédito</span>
          <strong>{currency.format(Number(account?.creditLimit || 0))}</strong>
        </div>
      </section>

      <p className="banking-note">O saldo começa em zero. Para testar transferências, adicione saldo para sua própria conta abaixo.</p>

      <div className="banking-grid">
        <section className="form-container">
          <div className="banking-section-heading">
            <span className="banking-section-icon received">+</span>
            <div><h3>Adicionar saldo</h3><p>Crie um depósito de teste na sua conta.</p></div>
          </div>
          <form className="banking-form" onSubmit={handleDeposit}>
            <label>Valor do depósito<input type="text" inputMode="decimal" value={depositAmount} onChange={(event) => handleMoneyChange(setDepositAmount, event.target.value)} required placeholder="R$ 100,00" data-testid="deposit-amount" /></label>
            <button className="primary-action" type="submit" disabled={isSubmitting} data-testid="deposit-submit">Adicionar saldo</button>
          </form>
        </section>

        <section className="form-container">
          <div className="banking-section-heading">
            <span className="banking-section-icon">↗</span>
            <div><h3>Transferir</h3><p>Envie saldo para outro usuário cadastrado.</p></div>
          </div>
          <form className="banking-form" onSubmit={handleTransfer}>
            <label>E-mail do destinatário<input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} required placeholder="destinatario@qa.com" data-testid="transfer-recipient" /></label>
            <label>Valor<input type="text" inputMode="decimal" value={amount} onChange={(event) => handleMoneyChange(setAmount, event.target.value)} required placeholder="R$ 0,00" data-testid="transfer-amount" /></label>
            <button className="primary-action" type="submit" disabled={isSubmitting} data-testid="transfer-submit">Transferir saldo</button>
          </form>
        </section>

        <section className="form-container">
          <div className="banking-section-heading">
            <span className="banking-section-icon credit">★</span>
            <div><h3>Análise de crédito</h3><p>Solicite um aumento de limite e receba uma análise randômica.</p></div>
          </div>
          {isAnalyzing ? (
            <div className="credit-analysis-screen" role="status" data-testid="credit-analysis-screen">
              <span className="credit-analysis-spinner" aria-hidden="true" />
              <strong>Analisando seu perfil<span className="analysis-dots">...</span></strong>
              <span>Consultando os critérios da roleta de crédito</span>
            </div>
          ) : (
            <form className="banking-form" onSubmit={handleCreditAnalysis}>
              <label>Valor informado<input type="text" inputMode="decimal" value={requestedLimit} onChange={(event) => handleMoneyChange(setRequestedLimit, event.target.value, 10000)} required placeholder="R$ 1.000,00" data-testid="credit-limit" /></label>
              <small className="banking-field-note">O valor informado não altera a regra: cada aprovação aumenta R$ 1.000,00, até R$ 10.000,00.</small>
              <button className="primary-action credit-action" type="submit" disabled={isSubmitting} data-testid="credit-submit">Girar roleta de crédito</button>
            </form>
          )}
        </section>
      </div>

      <section className="table-container banking-history">
        <div className="banking-history-header"><h3>Movimentações recentes</h3><span>{transactions.length} registros</span></div>
        {transactions.length === 0 ? <p className="banking-empty">Nenhuma movimentação registrada.</p> : (
          <div className="banking-transactions">
            {transactions.map((transaction) => (
              <div className="banking-transaction" key={transaction.id}>
                <span className={`banking-transaction-mark ${transaction.type === 'TRANSFER_SENT' ? 'sent' : 'received'}`}>{transaction.type === 'TRANSFER_SENT' ? '-' : '+'}</span>
                <div><strong>{transaction.type === 'DEPOSIT' ? 'Depósito em conta' : transaction.type === 'TRANSFER_RECEIVED' ? 'Transferência recebida' : 'Transferência enviada'}</strong><span>{transaction.description || 'Movimentação bancária'}</span></div>
                <strong className={transaction.type === 'TRANSFER_SENT' ? 'sent-text' : 'received-text'}>{currency.format(Number(transaction.amount))}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Banking;