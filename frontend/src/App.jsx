import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AddTask from './components/AddTask';
import TeamUpdates from './components/TeamUpdates';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';

const App = () => {
  // 1. Initialize State directly from LocalStorage
  // This ensures that when you refresh, the user stays logged in.
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // 2. Login Handler (Passed to LoginPage)
  // This updates the App state immediately after a successful API login
  const handleLoginState = (newToken) => {
    setToken(newToken);
    // We also update the user state so the Header shows the name immediately
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
  };

  // 3. Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="app-container">
        
        {/* IF NO TOKEN -> SHOW LOGIN PAGE */}
        {!token ? (
          <Routes>
            {/* We pass 'handleLoginState' as the 'setToken' prop because your LoginPage expects 'setToken' */}
            <Route path="*" element={<LoginPage setToken={handleLoginState} />} />
          </Routes>
        ) : (
          /* IF TOKEN EXISTS -> SHOW DASHBOARD LAYOUT */
          <>
            <Sidebar />
            
            <div className="main-content">
              {/* Pass user info to Header */}
              <Header user={user} onLogout={handleLogout} /> 
              
              <div className="content-area">
                <Routes>
                  {/* Route 1: Home (Add Task) */}
                  <Route path="/" element={<AddTask />} />
                  
                  {/* Route 2: Team Updates */}
                  <Route path="/team-updates" element={<TeamUpdates />} />
                  
                  {/* Route 3: Settings */}
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Fallback - Redirect unknown routes to Home */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </div>
          </>
        )}
      </div>
    </Router>
  );
};

export default App;