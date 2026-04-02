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
import ProjectsOverview from './components/ProjectsOverview'; 
import AddEmployee from './components/AddEmployee';
import EditEmployee from './components/EditEmployee';
import TagsManagement from "./components/TagsManagement";

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

  if (loading) return null;

  return (
    <div className="app-container">
      {!user ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
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
                  <Route path="/employee/team-updates" element={<TeamUpdates />} />
                </Route>

                {/* MANAGER ZONE */}
                <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
                  <Route path="/manager/dashboard" element={<ManagerDailyTaskUpdates />} />
                  <Route path="/manager/daily-tasks" element={<ManagerDailyTaskUpdates />} />
                  <Route path="/manager/projects-overview" element={<ProjectsOverview />} />
                  <Route path="/manager/employee-overview" element={<EmployeeOverview />} />
                  <Route path="/manager/employee-overview/add-employee" element={<AddEmployee />} />
                  <Route path="/manager/employee-overview/edit/:id" element={<EditEmployee />} />
                  
                  {/* <-- NEW TAGS MANAGEMENT ROUTE --> */}
                  <Route path="/manager/tags" element={<TagsManagement />} />
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
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
};

export default App;