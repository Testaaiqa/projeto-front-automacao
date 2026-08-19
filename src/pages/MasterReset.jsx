import React, { useState } from 'react';
import { resetPlatform } from '../services/userService.js';

const REQUIRED_CONFIRMATION = 'RESETAR_TODA_A_PLATAFORMA';

function MasterReset({ currentUser, onLogout }) {
  const [confirmation, setConfirmation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  async function handleReset(event) {
    event.preventDefault();
    setFeedback('');
    setError('');
    setIsResetting(true);

    try {
      const result = await resetPlatform(confirmation);
      if (!result.success) {
        setError(result.message || 'Não foi possível limpar a plataforma.');
        return;
      }

      const deleted = result.deleted || {};
      setFeedback(`Limpeza concluída: ${deleted.users || 0} usuários, ${deleted.accounts || 0} contas, ${deleted.transactions || 0} movimentações e ${deleted.creditAnalyses || 0} análises removidas.`);
      setConfirmation('');
    } catch (requestError) {
      setError('Não foi possível conectar ao procedimento de limpeza.');
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <main className="master-reset-page" data-testid="master-reset-page">
      <section className="master-reset-card">
        <div className="master-reset-header">
          <span className="master-reset-badge">M</span>
          <div>
            <span className="master-reset-eyebrow">Acesso restrito</span>
            <h1>Procedimento de limpeza</h1>
            <p>Conta mestre autenticada: {currentUser.email}</p>
          </div>
        </div>

        <div className="master-reset-instructions">
          <h2>O que será removido</h2>
          <p>Todos os usuários comuns, contas bancárias, movimentações e análises de crédito serão apagados permanentemente.</p>
          <p>A conta mestre será preservada para permitir uma nova limpeza no futuro.</p>
        </div>

        <form className="master-reset-form" onSubmit={handleReset}>
          <label>
            Para confirmar, digite <strong>{REQUIRED_CONFIRMATION}</strong>
            <input type="text" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" placeholder={REQUIRED_CONFIRMATION} data-testid="master-reset-confirmation" />
          </label>
          <button className="master-reset-action" type="submit" disabled={isResetting || confirmation !== REQUIRED_CONFIRMATION} data-testid="master-reset-submit">
            {isResetting ? 'Limpando plataforma...' : 'Apagar todos os dados'}
          </button>
        </form>

        {error && <p className="error-message" role="alert" data-testid="master-reset-error">{error}</p>}
        {feedback && <p className="success-message" role="status" data-testid="master-reset-feedback">{feedback}</p>}

        <button className="master-logout" type="button" onClick={onLogout} data-testid="master-logout">Sair da conta mestre</button>
      </section>
    </main>
  );
}

export default MasterReset;
