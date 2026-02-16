import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User, Settings as SettingsIcon, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../config'; 
import { useUser } from '../context/UserContext';

const Header = () => {
  const { user, logout } = useUser(); // Get user AND logout function from Context
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Use the global user directly
  const userData = user;

  // --- CLICK OUTSIDE LISTENER ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HELPER FUNCTIONS ---
  const handleLogout = () => {
    setDropdownOpen(false);
    logout(); // Clear context/localstorage
    navigate('/login'); // Redirect to login
  };

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    // Check if API_BASE_URL is defined, otherwise return path as is
    return typeof API_BASE_URL !== 'undefined' ? `${API_BASE_URL}${avatarPath}` : avatarPath;
  };

  const getDisplayName = () => {
    if (!userData) return 'Guest';
    if (userData.first_name?.trim()) return userData.first_name;
    if (userData.full_name?.trim() && userData.full_name !== userData.username) {
      return userData.full_name.split(' ')[0];
    }
    if (userData.username) {
      let name = userData.username.replace(/[._-]/g, ' ').replace(/[0-9]/g, '');
      return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "User";
    }
    return 'User';
  };

  const displayName = getDisplayName();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      {/* Left: Date & Notifications */}
      <div className="header-left-items">
        <div className="date-display">
          <Calendar size={18} className="icon-grey" />
          <span>{new Date().toDateString()}</span>
        </div>
        <div className="notification-icon">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </div>
      </div>

      {/* Right: User Profile */}
      <div className="header-right" ref={dropdownRef} style={{ position: 'relative' }}>
        <div
          className="user-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '5px 10px', borderRadius: '8px', transition: 'background 0.2s' }}
        >
          {/* AVATAR */}
          <div style={{ flexShrink: 0 }}>
            {getAvatarUrl(userData?.avatar || userData?.profile_pic) ? (
              <img
                src={getAvatarUrl(userData.avatar || userData.profile_pic)}
                alt="Profile"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB', display: 'block' }}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', border: '1px solid #E5E7EB' }}>
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* TEXT SECTION */}
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1F2937', lineHeight: '1.2' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              {userData?.role || userData?.designation || 'Employee'}
            </span>
          </div>

          <ChevronDown size={16} className={`dropdown-arrow ${dropdownOpen ? 'rotate' : ''}`} style={{ color: '#9CA3AF' }} />
        </div>

        {/* DROPDOWN MENU */}
        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-user-header">
              <small>Signed in as</small>
              <div style={{ fontWeight: 'bold' }}>{userData?.username || userData?.email}</div>
            </div>

            {/* --- ADDED: PROFILE LINK --- */}
            <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
              <User size={16} /> View Profile
            </Link>

            <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
              <SettingsIcon size={16} /> Settings
            </Link>

            <div className="dropdown-divider"></div>

            <div className="dropdown-item logout" onClick={handleLogout}>
              <LogOut size={16} /> Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;