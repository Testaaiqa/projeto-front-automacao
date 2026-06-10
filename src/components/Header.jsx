import React from 'react';

function Header({ onMenuToggle, currentUser }) {
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

        <div className="header-title">
          <h1 data-testid="header-title">Testa ai QA</h1>
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
