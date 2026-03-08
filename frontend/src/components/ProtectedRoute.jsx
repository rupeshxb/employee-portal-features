import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useContext(UserContext);

    // 1. Wait for context
    if (loading) return null;

    // 2. STOPS GUESTS
    if (!user) return <Navigate to="/login" replace />;

    // 3. ROBUST MANAGER CHECK: Matches our Login.jsx logic exactly
    const isManager = user.is_manager === true || user.role === 'Manager' || user.designation === 'Admin';
    const currentRole = isManager ? 'Manager' : 'Employee';

    // 4. AUTHORIZATION: Kick them to their respective dashboards if they don't belong
    if (allowedRoles && !allowedRoles.includes(currentRole)) {
        return currentRole === 'Manager'
            ? <Navigate to="/manager/dashboard" replace />
            : <Navigate to="/employee/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;