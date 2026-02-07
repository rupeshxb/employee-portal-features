import React from 'react';
const Header = () => (
  <header className="header">
    <span>📅 {new Date().toDateString()}</span>
    <span>🔔</span>
    <div className="user-profile"><div className="avatar"></div><span>Devendra Budathoki</span></div>
  </header>
);
export default Header;