import React from 'react';

function Home() {
  const modules = [
    {
      id: 'usuarios',
      title: 'Usuários',
      description: 'Gerencie usuários da plataforma',
      icon: '👥',
      color: '#126d82',
    },
    {
      id: 'progressive-bar',
      title: 'Progressive Bar',
      description: 'Teste componentes com barra de progresso',
      icon: '📊',
      color: '#ebd544',
    },
    {
      id: 'forms',
      title: 'Formulários',
      description: 'Teste cenários com formulários interativos',
      icon: '📋',
      color: '#d5573b',
    },
    {
      id: 'tabelas',
      title: 'Tabelas',
      description: 'Explore tabelas dinâmicas e filtros',
      icon: '📑',
      color: '#59aa8a',
    },
    {
      id: 'alerts',
      title: 'Alertas',
      description: 'Interaja com diferentes tipos de alertas',
      icon: '⚠️',
      color: '#ff6b6b',
    },
    {
      id: 'modais',
      title: 'Modais',
      description: 'Teste componentes modais e overlays',
      icon: '🪟',
      color: '#8e7cc3',
    },
  ];

  return (
    <div className="home-page" data-testid="home-page">
      <section className="home-welcome">
        <div className="welcome-content">
          <h2 data-testid="home-title">Bem-vindo ao Testa ai QA</h2>
          <p data-testid="home-subtitle">
            Aprenda fluxos de automação com cenários simples, rastreáveis e prontos para testes.
          </p>
        </div>
      </section>

      <section className="home-modules">
        <h3 className="modules-title" data-testid="modules-title">Módulos Disponíveis</h3>
        <div className="modules-grid">
          {modules.map((module) => (
            <div
              key={module.id}
              className="module-card"
              data-testid={`module-card-${module.id}`}
              style={{ borderLeftColor: module.color }}
            >
              <div className="module-icon">{module.icon}</div>
              <h3 className="module-title">{module.title}</h3>
              <p className="module-description">{module.description}</p>
              <button
                className="module-button"
                data-testid={`module-btn-${module.id}`}
                style={{ backgroundColor: module.color }}
              >
                Acessar
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="home-stats">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">6</div>
            <div className="stat-label">Módulos</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">∞</div>
            <div className="stat-label">Cenários</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">100%</div>
            <div className="stat-label">Automatizável</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
