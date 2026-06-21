import React, { useEffect, useMemo, useState } from 'react';

const ALERT_HISTORY_LIMIT = 6;

const INLINE_ALERTS = {
  success: {
    title: 'Operação concluída',
    message: 'A solicitação foi processada com sucesso.',
  },
  warning: {
    title: 'Atenção necessária',
    message: 'Existem campos que precisam de conferência antes de continuar.',
  },
  error: {
    title: 'Falha no processamento',
    message: 'Não foi possível concluir a ação. Tente novamente.',
  },
  info: {
    title: 'Atualização disponível',
    message: 'Uma nova versão dos dados está pronta para consulta.',
  },
};

function Alerts() {
  const [inlineType, setInlineType] = useState('success');
  const [isInlineVisible, setIsInlineVisible] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [snackbar, setSnackbar] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [promptValue, setPromptValue] = useState('');
  const [lastResult, setLastResult] = useState('Nenhuma ação executada.');
  const [history, setHistory] = useState([]);

  const activeInline = INLINE_ALERTS[inlineType];

  const historyText = useMemo(() => {
    if (history.length === 0) {
      return 'Sem registros.';
    }

    return history.map((item) => item.label).join(' | ');
  }, [history]);

  function addHistory(label) {
    setHistory((currentHistory) => [
      { id: Date.now(), label },
      ...currentHistory.slice(0, ALERT_HISTORY_LIMIT - 1),
    ]);
  }

  function updateResult(message) {
    setLastResult(message);
    addHistory(message);
  }

  function showNativeAlert() {
    window.alert('Alerta nativo exibido com sucesso.');
    updateResult('Alert nativo confirmado.');
  }

  function showNativeConfirm() {
    const confirmed = window.confirm('Deseja aprovar esta solicitação?');
    updateResult(confirmed ? 'Confirm nativo aprovado.' : 'Confirm nativo cancelado.');
  }

  function showNativePrompt() {
    const answer = window.prompt('Informe o nome do responsável:', promptValue || 'QA Tester');

    if (answer === null) {
      updateResult('Prompt nativo cancelado.');
      return;
    }

    setPromptValue(answer);
    updateResult(`Prompt nativo preenchido: ${answer}.`);
  }

  function showToast(type) {
    const toast = {
      id: Date.now(),
      type,
      message: type === 'success' ? 'Registro salvo com sucesso.' : 'Não foi possível salvar o registro.',
    };

    setToasts((currentToasts) => [toast, ...currentToasts].slice(0, 3));
    updateResult(`Toast ${type === 'success' ? 'de sucesso' : 'de erro'} exibido.`);
  }

  function removeToast(toastId) {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }

  function showSnackbar() {
    setSnackbar({
      id: Date.now(),
      message: 'Item arquivado.',
    });
    updateResult('Snackbar exibido.');
  }

  function undoSnackbar() {
    setSnackbar(null);
    updateResult('Ação do snackbar desfeita.');
  }

  function openModal(type) {
    setModalType(type);
    updateResult(type === 'danger' ? 'Modal de exclusão aberto.' : 'Modal informativo aberto.');
  }

  function closeModal(result) {
    setModalType(null);
    updateResult(result);
  }

  function changeInlineAlert(type) {
    setInlineType(type);
    setIsInlineVisible(true);
    updateResult(`Alerta inline alterado para ${type}.`);
  }

  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setToasts((currentToasts) => currentToasts.slice(0, -1));
    }, 4500);

    return () => clearTimeout(timeoutId);
  }, [toasts]);

  useEffect(() => {
    if (!snackbar) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setSnackbar(null);
    }, 6000);

    return () => clearTimeout(timeoutId);
  }, [snackbar]);

  return (
    <div className="alerts-page" data-testid="alerts-page">
      <div className="page-header">
        <div>
          <h2 data-testid="alerts-title">Alertas</h2>
          <p className="page-description">Cenários comuns para validação de mensagens, decisões e feedbacks.</p>
        </div>
      </div>

      <div className="alerts-layout">
        <section className="alerts-section" data-testid="native-alerts-section">
          <div className="alerts-section-heading">
            <h3>Alertas nativos</h3>
            <span>Browser</span>
          </div>
          <div className="alerts-actions-grid">
            <button className="primary-action" type="button" onClick={showNativeAlert} data-testid="native-alert-btn">
              Alert
            </button>
            <button className="secondary-action" type="button" onClick={showNativeConfirm} data-testid="native-confirm-btn">
              Confirm
            </button>
            <button className="secondary-action" type="button" onClick={showNativePrompt} data-testid="native-prompt-btn">
              Prompt
            </button>
          </div>
          <label className="alerts-input-label">
            Valor sugerido no prompt
            <input
              name="promptValue"
              value={promptValue}
              onChange={(event) => setPromptValue(event.target.value)}
              placeholder="QA Tester"
              data-testid="prompt-default-input"
            />
          </label>
        </section>

        <section className="alerts-section" data-testid="inline-alerts-section">
          <div className="alerts-section-heading">
            <h3>Alertas inline</h3>
            <span>Status</span>
          </div>
          <div className="alert-type-tabs" role="group" aria-label="Tipos de alerta inline">
            {Object.keys(INLINE_ALERTS).map((type) => (
              <button
                key={type}
                className={inlineType === type ? 'active' : ''}
                type="button"
                onClick={() => changeInlineAlert(type)}
                data-testid={`inline-alert-${type}-btn`}
              >
                {type}
              </button>
            ))}
          </div>

          {isInlineVisible && (
            <div className={`inline-alert ${inlineType}`} role="alert" data-testid="inline-alert-message">
              <div>
                <strong>{activeInline.title}</strong>
                <p>{activeInline.message}</p>
              </div>
              <button type="button" onClick={() => setIsInlineVisible(false)} aria-label="Fechar alerta" data-testid="dismiss-inline-alert-btn">
                ×
              </button>
            </div>
          )}
        </section>

        <section className="alerts-section" data-testid="toast-alerts-section">
          <div className="alerts-section-heading">
            <h3>Toasts e snackbar</h3>
            <span>Feedback</span>
          </div>
          <div className="alerts-actions-grid">
            <button className="primary-action" type="button" onClick={() => showToast('success')} data-testid="success-toast-btn">
              Toast sucesso
            </button>
            <button className="secondary-action" type="button" onClick={() => showToast('error')} data-testid="error-toast-btn">
              Toast erro
            </button>
            <button className="secondary-action" type="button" onClick={showSnackbar} data-testid="snackbar-btn">
              Snackbar
            </button>
          </div>
        </section>

        <section className="alerts-section" data-testid="custom-modal-section">
          <div className="alerts-section-heading">
            <h3>Modais customizados</h3>
            <span>Aplicação</span>
          </div>
          <div className="alerts-actions-grid">
            <button className="primary-action" type="button" onClick={() => openModal('info')} data-testid="info-modal-btn">
              Modal informativo
            </button>
            <button className="danger-action" type="button" onClick={() => openModal('danger')} data-testid="danger-modal-btn">
              Excluir item
            </button>
          </div>
        </section>

        <section className="alerts-section alerts-result-section" data-testid="alerts-result-section">
          <div className="alerts-section-heading">
            <h3>Resultado</h3>
            <span>Log</span>
          </div>
          <div className="alerts-result-panel">
            <strong data-testid="alerts-last-result">{lastResult}</strong>
            <p data-testid="alerts-history">{historyText}</p>
          </div>
        </section>
      </div>

      <div className="toast-region" aria-live="polite" data-testid="toast-region">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-message ${toast.type}`} data-testid={`toast-${toast.type}`}>
            <span>{toast.message}</span>
            <button type="button" onClick={() => removeToast(toast.id)} aria-label="Fechar toast">
              ×
            </button>
          </div>
        ))}
      </div>

      {snackbar && (
        <div className="snackbar-message" role="status" data-testid="snackbar-message">
          <span>{snackbar.message}</span>
          <button type="button" onClick={undoSnackbar} data-testid="snackbar-undo-btn">
            Desfazer
          </button>
        </div>
      )}

      {modalType && (
        <div className="modal-overlay" data-testid="alerts-modal-overlay">
          <section className={`modal-content alerts-modal ${modalType}`} role="dialog" aria-modal="true" data-testid="alerts-modal">
            <h3>{modalType === 'danger' ? 'Confirmar exclusão' : 'Processamento iniciado'}</h3>
            <p>
              {modalType === 'danger'
                ? 'Esta ação remove o item selecionado da lista.'
                : 'A rotina foi enviada para execução e será registrada no histórico.'}
            </p>
            <div className="modal-actions">
              {modalType === 'danger' ? (
                <>
                  <button className="danger-action" type="button" onClick={() => closeModal('Exclusão confirmada.')} data-testid="confirm-danger-modal-btn">
                    Excluir
                  </button>
                  <button className="secondary-action" type="button" onClick={() => closeModal('Exclusão cancelada.')} data-testid="cancel-danger-modal-btn">
                    Cancelar
                  </button>
                </>
              ) : (
                <button className="primary-action" type="button" onClick={() => closeModal('Modal informativo confirmado.')} data-testid="close-info-modal-btn">
                  Entendi
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Alerts;
