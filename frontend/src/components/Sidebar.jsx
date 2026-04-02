import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Settings,
  LayoutDashboard,
  Clock,
  TrendingUp,
  UserPlus,
  FileText,
  Calculator,
  History,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';
import { BrandIcon, TagIcon } from './Icons';
import { UserContext } from '../context/UserContext';
import '../style/Sidebar.css';

const Sidebar = () => {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user?.is_manager ?? storedUser?.is_manager ?? false;

  if (loading) return <aside className="sidebar loading"></aside>;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <BrandIcon />
        </div>
        <div className="brand-text">
          <span className="brand-title">hamrosalary</span>
          <span className="brand-subtitle">
            {isManager ? 'MANAGER PORTAL' : 'EMPLOYEE PORTAL'}
          </span>
        </div>
      </div>

      <nav>
        {/* --- EMPLOYEE MENU --- */}
        {!isManager && (
          <>
            <NavLink
              to="/employee/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end
            >
              <Calendar size={20} />
              <span>Daily Tasks</span>
            </NavLink>

            <NavLink
              to="/employee/team-updates"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Team Updates</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </>
        )}

        {/* --- MANAGER MENU --- */}
        {isManager && (
          <>
            <div className="nav-section-title">PAYROLL MANAGEMENT</div>
            <NavLink to="/manager/bulk-slips" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileText size={20} />
              <span>Bulk Slip Generator</span>
            </NavLink>
            <NavLink to="/manager/calculator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Calculator size={20} />
              <span>Calculator</span>
            </NavLink>
            <NavLink to="/manager/salary-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <History size={20} />
              <span>Salary Slip History</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>

            <div className="nav-section-title">WORK MANAGEMENT</div>
            <NavLink
              to="/manager/daily-tasks"
              className={() => `nav-item ${['/manager/dashboard', '/manager/daily-tasks'].includes(location.pathname) ? 'active' : ''}`}
            >
              <CheckCircle2 size={20} />
              <span>Daily Task Updates</span>
            </NavLink>

            <NavLink to="/manager/projects-overview" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <ClipboardList size={20} />
              <span>Projects Overview</span>
            </NavLink>
            <NavLink
              to="/manager/tags"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <TagIcon />
              <span>Tags Management</span>
            </NavLink>

            <div className="nav-section-title">EMPLOYEE MANAGEMENT</div>
            <NavLink
              to="/manager/employee-overview"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Employee Overview</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;