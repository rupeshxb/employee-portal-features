import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, Settings, LayoutGrid } from 'lucide-react'; // Import icons

const Sidebar = () => (
  <aside className="sidebar">
    <div className="brand">
        <div className="brand-logo">H</div> 
        <span>hamrosalary</span>
    </div>
    
    <nav>
      {/* 1. Daily Tasks */}
      <NavLink 
        to="/" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        end
      >
        <Calendar size={20} />
        <span>Add Daily Tasks</span>
      </NavLink>

      {/* 2. Team Updates */}
      <NavLink 
        to="/team-updates" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Users size={20} />
        <span>Team Updates</span>
      </NavLink>

      {/* 3. Settings */}
      <NavLink 
        to="/settings" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <Settings size={20} />
        <span>Settings</span>
      </NavLink>
    </nav>
  </aside>
);

export default Sidebar;