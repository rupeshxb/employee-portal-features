import React from 'react';
const Sidebar = () => (
  <aside className="sidebar">
    <div className="brand"><span>H</span> hamrosalary</div>
    <nav>
      <div className="nav-item active">📅 Add Daily Tasks</div>
      <div className="nav-item">👥 Team Updates</div>
      <div className="nav-item">⚙️ Settings</div>
    </nav>
  </aside>
);
export default Sidebar;