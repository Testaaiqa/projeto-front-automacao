import React from 'react';

const stroke = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 1.8 };

function FlowIcon({ type, size = 24 }) {
  const icons = {
    home: <><path {...stroke} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" /><path {...stroke} d="M9 21v-6h6v6" /></>,
    usuarios: <><circle {...stroke} cx="9" cy="8" r="3" /><path {...stroke} d="M3.5 20a5.5 5.5 0 0 1 11 0M17 11a2.5 2.5 0 1 0-1.5-4.5M18.5 20a5 5 0 0 0-3.2-4.65" /></>,
    banking: <><path {...stroke} d="M3 9h18M5 9v10M19 9v10M3 21h18M2 6l10-4 10 4v3H2V6Z" /><path {...stroke} d="M9 12v5M15 12v5" /></>,
    'progressive-bar': <><rect {...stroke} height="12" rx="2" width="18" x="3" y="6" /><path {...stroke} d="M6 15v-3M10 15v-5M14 15v-7M18 15v-4" /></>,
    forms: <><rect {...stroke} height="19" rx="2" width="14" x="5" y="3" /><path {...stroke} d="M8 8h8M8 12h8M8 16h5M6.5 8h.01M6.5 12h.01M6.5 16h.01" /></>,
    tabelas: <><rect {...stroke} height="16" rx="2" width="18" x="3" y="4" /><path {...stroke} d="M3 10h18M9 4v16M15 10v10" /></>,
    alerts: <><path {...stroke} d="M10.3 4.1 2.7 18a2 2 0 0 0 1.75 3h15.1a2 2 0 0 0 1.75-3L13.7 4.1a2 2 0 0 0-3.4 0Z" /><path {...stroke} d="M12 9v4M12 17h.01" /></>,
    modais: <><rect {...stroke} height="14" rx="2" width="18" x="3" y="5" /><path {...stroke} d="M3 9h18M7 7h.01M10 7h.01M15 13h3M15 16h2" /></>,
  };

  return <svg aria-hidden="true" className="flow-icon" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg">{icons[type]}</svg>;
}

export default FlowIcon;
