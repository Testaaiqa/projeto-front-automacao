import React from 'react';

function ComingSoon({ title, description }) {
  return (
    <div className="coming-soon-page" data-testid="coming-soon-page">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">🚀</div>
        <h2 data-testid="coming-soon-title">{title}</h2>
        <p data-testid="coming-soon-description">{description}</p>
        <div className="coming-soon-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p className="coming-soon-message">Em breve...</p>
      </div>
    </div>
  );
}

export default ComingSoon;
