import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, User, Settings, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const Header = ({ user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- 1. HANDLE DATA STRUCTURE ---
  const userData = user?.user || user; 

  // DEBUG: Check what the frontend is actually receiving
  console.log("Header User Data:", userData);

  // --- 2. CLICK OUTSIDE LISTENER ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 3. HELPER FUNCTIONS ---
  
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `${API_BASE_URL}${avatarPath}`;
  };

  // --- 4. SMART NAME LOGIC ---
  const getDisplayName = () => {
    if (!userData) return 'Guest';

    // Priority 1: The actual 'first_name' from the Database (requires logout/login)
    if (userData.first_name && userData.first_name.trim() !== "") {
        return userData.first_name;
    }

    // Priority 2: Extract from 'full_name'
    if (userData.full_name && userData.full_name.trim() !== "") {
        // If full_name is just the username, skip to fallback
        if (userData.full_name !== userData.username) {
             return userData.full_name.split(' ')[0];
        }
    }

    // Priority 3: Fallback -> Beautify the Username
    // Converts "b.shakya" -> "B Shakya"
    if (userData.username) {
        let name = userData.username;
        
        // Replace dots, underscores, dashes with space
        name = name.replace(/[._-]/g, ' '); 
        
        // Remove numbers
        name = name.replace(/[0-9]/g, '');

        // Capitalize Words
        name = name.split(' ')
                   .filter(word => word.length > 0)
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                   .join(' ');
                   
        return name || "User";
    }

    return 'User'; 
  };

  const displayName = getDisplayName();

  // Get Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // --- 5. RENDER ---
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
      <div
        className="header-right"
        ref={dropdownRef}
        style={{ position: 'relative' }} 
      >
        <div
          className="user-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '5px 10px',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
        >
          
          {/* A. AVATAR SECTION */}
          <div style={{ flexShrink: 0 }}>
            {getAvatarUrl(userData?.avatar || userData?.profile_pic) ? (
              <img
                src={getAvatarUrl(userData.avatar || userData.profile_pic)}
                alt="Profile"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #E5E7EB',
                  display: 'block'
                }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#4F46E5',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px',
                border: '1px solid #E5E7EB'
              }}>
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {/* B. TEXT SECTION (Name & Role) */}
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            
            {/* NAME: Shows First Name (or Capitalized Username as fallback) */}
            <span style={{ 
                fontWeight: '600', 
                fontSize: '0.95rem', 
                color: '#1F2937', 
                lineHeight: '1.2' 
            }}>
                {displayName}
            </span>
            
            {/* ROLE */}
            <span style={{ 
                fontSize: '0.75rem', 
                color: '#6B7280',
                marginTop: '2px' 
            }}>
                {userData?.role || userData?.designation || 'Employee'}
            </span>
          </div>

          {/* C. ARROW ICON */}
          <ChevronDown size={16} className={`dropdown-arrow ${dropdownOpen ? 'rotate' : ''}`} style={{color: '#9CA3AF'}} />
        </div>

        {/* D. DROPDOWN MENU */}
        {dropdownOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-user-header">
              <small>Signed in as</small>
              <div style={{fontWeight: 'bold'}}>{userData?.username || userData?.email}</div>
            </div>

            <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
              <User size={16} /> View Profile
            </Link>

            <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
              <Settings size={16} /> Settings
            </Link>

            <div className="dropdown-divider"></div>

            <div
              className="dropdown-item logout"
              onClick={() => { setDropdownOpen(false); onLogout(); }}
            >
              <LogOut size={16} /> Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;