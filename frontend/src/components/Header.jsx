import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { useUser } from '../context/UserContext';
import { VerticalDividerIcon, HeaderCalendarIcon } from './Icons';

const Header = () => {
  const { user, logout } = useUser();
  const [avatarError, setAvatarError] = useState(false);
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

  useEffect(() => { setAvatarError(false); }, [avatarUrl]);

  const getInitials = () => {
    if (user?.first_name || user?.last_name) {
      return ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase();
    }
    if (user?.username) return user.username[0].toUpperCase();
    return 'U';
  };

  return (
    <header className="header">
      {/* Right: Date, Notifications & User Profile */}
      <div className="header-right" ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div className="date-display">
          <HeaderCalendarIcon className="icon-grey" />
          <span>{new Date().toDateString()}</span>
        </div>
        <VerticalDividerIcon className="header-divider" />
        <div className="notification-icon">
          <Bell size={22} strokeWidth={1.5} />
        </div>
        <VerticalDividerIcon className="header-divider" />
        <div
          className="user-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {/* AVATAR */}
          <div style={{ flexShrink: 0 }}>
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt="Profile"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB', display: 'block' }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', border: '1px solid #E5E7EB' }}>
                {getInitials()}
              </div>
            )}
          </div>

          {/* TEXT INFO */}
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span className="user-name">{displayName}</span>
            <span className="user-role">
              {user?.designation_name || user?.designation || user?.role || 'Employee'}
            </span>
          </div>

          <ChevronDown size={20} strokeWidth={1.5} className={`dropdown-arrow ${dropdownOpen ? 'rotate' : ''}`} style={{ color: '#17181A' }} />
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