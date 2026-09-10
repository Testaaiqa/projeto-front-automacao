import React from 'react';

function MenuIcon({ size = 24 }) {
  return (
    <svg
      aria-hidden="true"
      className="menu-icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

export default MenuIcon;
