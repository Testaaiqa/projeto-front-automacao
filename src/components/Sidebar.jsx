import React from 'react';

function Sidebar({ isOpen, onClose, onNavigate, currentUser }) {
  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: '👥',
    },
    {
      id: 'progressive-bar',
      label: 'Progressive Bar',
      icon: '📊',
    },
    {
      id: 'forms',
      label: 'Formulários',
      icon: '📋',
    },
    {
      id: 'tabelas',
      label: 'Tabelas',
      icon: '📑',
    },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: '⚠️',
    },
  ];

  const handleMenuClick = (itemId) => {
    onNavigate(itemId);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${isOpen ? 'open' : ''}`}
        data-testid="sidebar"
      >
        <div className="sidebar-header">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{currentUser?.name?.charAt(0) || '?'}</div>
            <div>
              <p className="sidebar-user-name">{currentUser?.name}</p>
              <p className="sidebar-user-email">{currentUser?.email}</p>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            data-testid="sidebar-close-btn"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className="sidebar-menu-item"
                  onClick={() => handleMenuClick(item.id)}
                  data-testid={`sidebar-menu-${item.id}`}
                >
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-logout-btn"
            onClick={() => {
              onNavigate('logout');
              onClose();
            }}
            data-testid="sidebar-logout-btn"
          >
            🚪 Sair
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
