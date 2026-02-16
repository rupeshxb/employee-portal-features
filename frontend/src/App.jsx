import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AddTask from './components/AddTask';
import TeamUpdates from './components/TeamUpdates';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';

// 1. IMPORT THE PROVIDER
import { UserProvider } from '../src/context/UserContext';

const App = () => {
  // 2. Manage Token Only (User data is now handled by Context)
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLoginState = (newToken) => {
    setToken(newToken);
    // No need to manually set user here anymore
    // The UserProvider will automatically fetch it when it mounts
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Optional, but good cleanup
    setToken(null);
  };

  return (
    <Router>
      <div className="app-container">

        {/* IF NO TOKEN -> SHOW LOGIN PAGE */}
        {!token ? (
          <Routes>
            <Route path="*" element={<LoginPage setToken={handleLoginState} />} />
          </Routes>
        ) : (
          /* IF TOKEN EXISTS -> SHOW DASHBOARD LAYOUT */
          /* 3. WRAP THE AUTHENTICATED APP IN USER PROVIDER */
          <UserProvider>

            <Sidebar />

            <div className="main-content">
              {/* 4. REMOVED 'user={user}' PROP - Header uses context now */}
              <Header onLogout={handleLogout} />

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

          </UserProvider>
        )}
      </div>
    </Router>
  );
};

export default App;