import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AddTask from './components/AddTask';
import TeamUpdates from './components/TeamUpdates';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerDailyTaskUpdates from './components/ManagerDailyTaskUpdates';
import EmployeeOverview from './components/EmployeeOverview';

// Import Context
import { UserProvider, UserContext } from '../src/context/UserContext';

const RootRedirect = () => {
  const { user } = useContext(UserContext);

  if (!user) return <Navigate to="/login" replace />;

  const isManager = user.is_manager === true || user.role === 'Manager' || user.designation === 'Admin';
  if (isManager) return <Navigate to="/manager/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
};

const AppContent = () => {
  const { user, loading, logout } = useContext(UserContext);

  if (loading) return null; // Or add a <div className="loading-screen">Loading...</div>

  return (
    <div className="app-container">
      {/* If there is no user, ONLY show the login page */}
      {!user ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        /* If there IS a user, show the App layout */
        <>
          <Sidebar />
          <div className="main-content">
            <Header onLogout={logout} />
            <div className="content-area">
              <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* EMPLOYEE ZONE */}
                <Route element={<ProtectedRoute allowedRoles={['Employee', 'Manager']} />}>
                  <Route path="/employee/dashboard" element={<AddTask />} />
                  {/* NEW ROUTE: Employee's view of Team Updates */}
                  <Route path="/employee/team-updates" element={<TeamUpdates />} />
                </Route>

                {/* MANAGER ZONE */}
                <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
                  {/* The initial login alias */}
                  <Route path="/manager/dashboard" element={<ManagerDailyTaskUpdates />} />

                  {/* The actual menu link they use going forward */}
                  <Route path="/manager/daily-tasks" element={<ManagerDailyTaskUpdates />} />

                  {/* EMPLOYEE OVERVIEW ROUTE */}
                  <Route path="/manager/employee-overview" element={<EmployeeOverview />} />
                </Route>

                {/* SHARED ZONE */}
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      {/* UserProvider wraps EVERYTHING so AppContent can read it immediately */}
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
};

export default App;