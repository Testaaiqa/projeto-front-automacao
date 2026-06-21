import React, { useEffect, useMemo, useState } from 'react';

const USERS = [
  {
    id: 'usr-101',
    name: 'Ana Martins',
    role: 'QA Lead',
    plan: 'Enterprise',
    status: 'Ativa',
    lastAccess: 'Hoje, 09:42',
  },
  {
    id: 'usr-102',
    name: 'Bruno Costa',
    role: 'Product Manager',
    plan: 'Growth',
    status: 'Pendente',
    lastAccess: 'Ontem, 18:10',
  },
  {
    id: 'usr-103',
    name: 'Carla Nunes',
    role: 'Dev Front-end',
    plan: 'Starter',
    status: 'Ativa',
    lastAccess: '20/06/2026, 14:05',
  },
];

const MODAL_LABELS = {
  details: 'Detalhes consultados.',
  form: 'Cadastro em modal aberto.',
  danger: 'Confirmação destrutiva aberta.',
  drawer: 'Painel lateral aberto.',
  wizard: 'Assistente por etapas aberto.',
  lightbox: 'Lightbox aberto.',
};

function Modals() {
  const [activeModal, setActiveModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const [modalForm, setModalForm] = useState({
    title: '',
    owner: '',
    priority: 'media',
    notes: '',
  });
  const [wizardStep, setWizardStep] = useState(1);
  const [lastResult, setLastResult] = useState('Nenhum modal aberto.');
  const [savedItems, setSavedItems] = useState([]);

  const selectedUserMeta = useMemo(() => {
    return `${selectedUser.role} | Plano ${selectedUser.plan} | ${selectedUser.status}`;
  }, [selectedUser]);

  function openModal(modalName, user = selectedUser) {
    setSelectedUser(user);
    setActiveModal(modalName);
    setLastResult(MODAL_LABELS[modalName]);
  }

  function closeModal(result = 'Modal fechado.') {
    setActiveModal(null);
    setLastResult(result);
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal('Modal fechado pelo backdrop.');
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setModalForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function saveModalForm(event) {
    event.preventDefault();

    const itemTitle = modalForm.title.trim() || 'Solicitação sem título';

    setSavedItems((currentItems) => [
      {
        id: Date.now(),
        title: itemTitle,
        owner: modalForm.owner.trim() || 'Responsável não informado',
        priority: modalForm.priority,
      },
      ...currentItems,
    ]);

    setModalForm({
      title: '',
      owner: '',
      priority: 'media',
      notes: '',
    });
    closeModal(`Solicitação "${itemTitle}" salva.`);
  }

  function deleteUser() {
    closeModal(`Usuário ${selectedUser.name} removido da lista de exemplo.`);
  }

  function finishWizard() {
    setWizardStep(1);
    closeModal('Configuração concluída pelo assistente.');
  }

  useEffect(() => {
    if (!activeModal) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        closeModal('Modal fechado com Escape.');
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeModal]);

  return (
    <div className="modals-page" data-testid="modals-page">
      <div className="page-header">
        <div>
          <h2 data-testid="modals-title">Modais</h2>
          <p className="page-description">Padrões usados em produtos digitais para confirmação, edição, consulta e fluxos guiados.</p>
        </div>
      </div>

      <div className="modals-layout">
        <section className="modals-section" data-testid="modal-examples-section">
          <div className="modals-section-heading">
            <h3>Exemplos principais</h3>
            <span>Componentes</span>
          </div>

          <div className="modal-example-grid">
            <button type="button" className="modal-example-button" onClick={() => openModal('details')} data-testid="open-details-modal-btn">
              <strong>Detalhes</strong>
              <span>Consulta rápida sem sair da tela.</span>
            </button>
            <button type="button" className="modal-example-button" onClick={() => openModal('form')} data-testid="open-form-modal-btn">
              <strong>Formulário</strong>
              <span>Criação ou edição contextual.</span>
            </button>
            <button type="button" className="modal-example-button danger" onClick={() => openModal('danger')} data-testid="open-danger-modal-btn">
              <strong>Confirmação</strong>
              <span>Ação irreversível com decisão explícita.</span>
            </button>
            <button type="button" className="modal-example-button" onClick={() => openModal('drawer')} data-testid="open-drawer-modal-btn">
              <strong>Painel lateral</strong>
              <span>Configuração com contexto preservado.</span>
            </button>
            <button type="button" className="modal-example-button" onClick={() => openModal('wizard')} data-testid="open-wizard-modal-btn">
              <strong>Wizard</strong>
              <span>Fluxo guiado em múltiplas etapas.</span>
            </button>
            <button type="button" className="modal-example-button" onClick={() => openModal('lightbox')} data-testid="open-lightbox-modal-btn">
              <strong>Lightbox</strong>
              <span>Pré-visualização com foco total.</span>
            </button>
          </div>
        </section>

        <section className="modals-section" data-testid="modal-records-section">
          <div className="modals-section-heading">
            <h3>Registros de exemplo</h3>
            <span>Tabela</span>
          </div>
          <div className="modal-users-list">
            {USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                className={`modal-user-row ${selectedUser.id === user.id ? 'selected' : ''}`}
                onClick={() => openModal('details', user)}
                data-testid={`modal-user-${user.id}`}
              >
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.role}</small>
                </span>
                <em>{user.status}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="modals-section modals-result-section" data-testid="modal-result-section">
          <div className="modals-section-heading">
            <h3>Resultado</h3>
            <span>Estado</span>
          </div>
          <div className="modals-result-panel">
            <strong data-testid="modal-last-result">{lastResult}</strong>
            <p data-testid="modal-selected-user">Selecionado: {selectedUser.name}</p>
            <p data-testid="modal-saved-count">Solicitações salvas: {savedItems.length}</p>
          </div>
        </section>
      </div>

      {activeModal && activeModal !== 'drawer' && (
        <div className="modal-overlay app-modal-overlay" onMouseDown={handleBackdropClick} data-testid="app-modal-overlay">
          <section className={`app-modal ${activeModal}`} role="dialog" aria-modal="true" data-testid={`${activeModal}-modal`}>
            {activeModal === 'details' && (
              <>
                <div className="app-modal-header">
                  <div>
                    <h3>Detalhes do usuário</h3>
                    <p>{selectedUserMeta}</p>
                  </div>
                  <button type="button" onClick={() => closeModal()} aria-label="Fechar modal" data-testid="close-details-modal-btn">
                    ×
                  </button>
                </div>
                <div className="modal-detail-grid">
                  <span>Nome</span>
                  <strong>{selectedUser.name}</strong>
                  <span>Último acesso</span>
                  <strong>{selectedUser.lastAccess}</strong>
                  <span>Identificador</span>
                  <strong>{selectedUser.id}</strong>
                </div>
                <div className="app-modal-actions">
                  <button className="secondary-action" type="button" onClick={() => openModal('form')} data-testid="details-edit-btn">
                    Editar dados
                  </button>
                  <button className="primary-action" type="button" onClick={() => closeModal('Detalhes confirmados.')} data-testid="details-confirm-btn">
                    Entendi
                  </button>
                </div>
              </>
            )}

            {activeModal === 'form' && (
              <form onSubmit={saveModalForm} data-testid="modal-form">
                <div className="app-modal-header">
                  <div>
                    <h3>Nova solicitação</h3>
                    <p>Cadastro rápido sem trocar de página.</p>
                  </div>
                  <button type="button" onClick={() => closeModal()} aria-label="Fechar modal" data-testid="close-form-modal-btn">
                    ×
                  </button>
                </div>
                <div className="modal-form-grid">
                  <label>
                    Título
                    <input name="title" value={modalForm.title} onChange={handleFormChange} placeholder="Revisar fluxo de checkout" data-testid="modal-title-input" />
                  </label>
                  <label>
                    Responsável
                    <input name="owner" value={modalForm.owner} onChange={handleFormChange} placeholder="Ana Martins" data-testid="modal-owner-input" />
                  </label>
                  <label>
                    Prioridade
                    <select name="priority" value={modalForm.priority} onChange={handleFormChange} data-testid="modal-priority-select">
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </label>
                  <label className="span-two">
                    Observações
                    <textarea name="notes" value={modalForm.notes} onChange={handleFormChange} placeholder="Contexto do atendimento" data-testid="modal-notes-input" />
                  </label>
                </div>
                <div className="app-modal-actions">
                  <button className="secondary-action" type="button" onClick={() => closeModal('Cadastro cancelado.')} data-testid="cancel-form-modal-btn">
                    Cancelar
                  </button>
                  <button className="primary-action" type="submit" data-testid="save-form-modal-btn">
                    Salvar
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'danger' && (
              <>
                <div className="app-modal-header">
                  <div>
                    <h3>Excluir usuário?</h3>
                    <p>Esta ação exige confirmação clara antes de continuar.</p>
                  </div>
                  <button type="button" onClick={() => closeModal('Exclusão cancelada.')} aria-label="Fechar modal" data-testid="close-danger-modal-btn">
                    ×
                  </button>
                </div>
                <div className="danger-modal-body">
                  <strong>{selectedUser.name}</strong>
                  <p>O registro será removido do cenário de teste desta tela.</p>
                </div>
                <div className="app-modal-actions">
                  <button className="secondary-action" type="button" onClick={() => closeModal('Exclusão cancelada.')} data-testid="cancel-delete-modal-btn">
                    Cancelar
                  </button>
                  <button className="danger-action" type="button" onClick={deleteUser} data-testid="confirm-delete-modal-btn">
                    Excluir
                  </button>
                </div>
              </>
            )}

            {activeModal === 'wizard' && (
              <>
                <div className="app-modal-header">
                  <div>
                    <h3>Assistente de configuração</h3>
                    <p>Etapa {wizardStep} de 3</p>
                  </div>
                  <button type="button" onClick={() => closeModal('Assistente fechado.')} aria-label="Fechar modal" data-testid="close-wizard-modal-btn">
                    ×
                  </button>
                </div>
                <div className="wizard-steps" data-testid="wizard-steps">
                  {[1, 2, 3].map((step) => (
                    <span key={step} className={wizardStep >= step ? 'active' : ''}>{step}</span>
                  ))}
                </div>
                <div className="wizard-content" data-testid="wizard-content">
                  {wizardStep === 1 && <p>Escolha o tipo de configuração que será aplicada ao produto.</p>}
                  {wizardStep === 2 && <p>Revise permissões, responsáveis e dependências antes da ativação.</p>}
                  {wizardStep === 3 && <p>Confirme a configuração final e conclua o fluxo guiado.</p>}
                </div>
                <div className="app-modal-actions">
                  <button className="secondary-action" type="button" disabled={wizardStep === 1} onClick={() => setWizardStep((step) => step - 1)} data-testid="wizard-back-btn">
                    Voltar
                  </button>
                  {wizardStep < 3 ? (
                    <button className="primary-action" type="button" onClick={() => setWizardStep((step) => step + 1)} data-testid="wizard-next-btn">
                      Avançar
                    </button>
                  ) : (
                    <button className="primary-action" type="button" onClick={finishWizard} data-testid="wizard-finish-btn">
                      Concluir
                    </button>
                  )}
                </div>
              </>
            )}

            {activeModal === 'lightbox' && (
              <>
                <div className="app-modal-header">
                  <div>
                    <h3>Pré-visualização</h3>
                    <p>Modal com foco no conteúdo visual.</p>
                  </div>
                  <button type="button" onClick={() => closeModal()} aria-label="Fechar modal" data-testid="close-lightbox-modal-btn">
                    ×
                  </button>
                </div>
                <div className="lightbox-preview" data-testid="lightbox-preview">
                  <div>
                    <strong>Release QA</strong>
                    <span>92% aprovado</span>
                  </div>
                </div>
                <div className="app-modal-actions">
                  <button className="primary-action" type="button" onClick={() => closeModal('Lightbox visualizado.')} data-testid="lightbox-confirm-btn">
                    Fechar visualização
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {activeModal === 'drawer' && (
        <div className="modal-overlay drawer-overlay" onMouseDown={handleBackdropClick} data-testid="drawer-overlay">
          <aside className="modal-drawer" role="dialog" aria-modal="true" data-testid="drawer-modal">
            <div className="app-modal-header">
              <div>
                <h3>Preferências da conta</h3>
                <p>Painel lateral para edição com contexto.</p>
              </div>
              <button type="button" onClick={() => closeModal()} aria-label="Fechar painel" data-testid="close-drawer-modal-btn">
                ×
              </button>
            </div>
            <div className="drawer-options">
              <label className="choice-option">
                <input type="checkbox" defaultChecked data-testid="drawer-email-checkbox" />
                Receber resumo por e-mail
              </label>
              <label className="choice-option">
                <input type="checkbox" data-testid="drawer-alert-checkbox" />
                Exibir alertas críticos
              </label>
              <label className="choice-option">
                <input type="checkbox" defaultChecked data-testid="drawer-history-checkbox" />
                Registrar histórico detalhado
              </label>
            </div>
            <div className="app-modal-actions">
              <button className="secondary-action" type="button" onClick={() => closeModal('Preferências descartadas.')} data-testid="drawer-cancel-btn">
                Cancelar
              </button>
              <button className="primary-action" type="button" onClick={() => closeModal('Preferências salvas.')} data-testid="drawer-save-btn">
                Salvar preferências
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Modals;
