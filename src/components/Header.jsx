import React from 'react';

function Header({ onMenuToggle, onBack, showBack, currentUser }) {
  return (
    <header className="header" data-testid="header">
      <div className="header-content">
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          data-testid="hamburger-btn"
          aria-label="Abrir menu"
        >
          <span className="hamburger-icon"></span>
          <span className="hamburger-icon"></span>
          <span className="hamburger-icon"></span>
        </button>

        {showBack && (
          <button
            className="header-back-btn"
            type="button"
            onClick={onBack}
            data-testid="header-back-button"
            aria-label="Voltar para a página inicial"
          >
            <span aria-hidden="true">←</span>
            Voltar
          </button>
        )}

        <div className="header-title">
          <h1 data-testid="header-title">Testa aí QA</h1>
        </div>

        <div className="header-user">
          <span className="header-user-name" data-testid="header-user-name">
            Bem-vindo, {currentUser?.name?.split(' ')[0]}!
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
