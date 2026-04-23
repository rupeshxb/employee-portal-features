import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User, Settings as SettingsIcon, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useUser } from '../context/UserContext';

const Header = () => {
  const { user, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  // --- UPDATED HELPER: Construct full URL for avatar with Version Timestamp ---
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;

    let finalUrl;

    // Check if it's already a full URL (e.g., external provider)
    if (avatarPath.startsWith('http')) {
      finalUrl = avatarPath;
    } else {
      // Construct local API URL
      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const path = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
      finalUrl = `${baseUrl}${path}`;
    }

    // APPEND THE VERSION TIMESTAMP TO FORCE REFRESH
    // This allows the browser to bypass the cache when the image changes
    if (user?.avatar_version) {
      return `${finalUrl}?v=${user.avatar_version}`;
    }

    return finalUrl;
  };

  // Helper: Determine display name (Priority: First Last > Username > Email)
  const getDisplayName = () => {
    if (!user) return 'Guest';
    if (user.first_name && user.first_name.trim() !== '') {
      return `${user.first_name} ${user.last_name || ''}`;
    }
    return user.username || user.email || 'User';
  };

  const displayName = getDisplayName();
  const avatarUrl = getAvatarUrl(user?.avatar || user?.profile_pic);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="header">
      {/* Right: Date, Notifications & User Profile */}
      <div className="header-right" ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="date-display">
          <Calendar size={18} className="icon-grey" />
          <span>{new Date().toDateString()}</span>
        </div>
        <div className="notification-icon">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </div>
        <div
          className="user-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '5px 10px', borderRadius: '8px' }}
        >
          {/* AVATAR */}
          <div style={{ flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB', display: 'block' }}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', border: '1px solid #E5E7EB' }}>
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* TEXT INFO */}
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1F2937', lineHeight: '1.2' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
              {user?.designation || user?.role || 'Employee'}
            </span>
          </div>

          <ChevronDown size={16} className={`dropdown-arrow ${dropdownOpen ? 'rotate' : ''}`} style={{ color: '#9CA3AF' }} />
        </div>

        {/* DROPDOWN MENU */}
        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-user-header">
              <small>Signed in as</small>
              <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email} {user?.username && `(${user?.username})`}
              </div>
            </div>

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