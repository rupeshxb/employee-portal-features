import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    // 1. Immediately check for existing user data to prevent loading flashes
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

    const [user, setUser] = useState(storedUser);
    const [loading, setLoading] = useState(!storedUser);

    // 2. THE NEW LOGIN FUNCTION: Updates storage AND state instantly
    const loginUser = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
    };

    const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/profile/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(prev => ({ ...prev, ...data }));
                localStorage.setItem('user', JSON.stringify(data)); // Sync storage
            } else if (res.status === 401) {
                logout();
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const updateUser = (newData) => {
        setUser((prev) => {
            const updated = { ...prev, ...newData, avatar_version: Date.now() };
            localStorage.setItem('user', JSON.stringify(updated)); // Keep storage synced
            return updated;
        });
    };

    const logout = () => {
        // Hard wipe of everything
        localStorage.clear();
        setUser(null);
        // Force browser redirect to wipe all lingering JS memory
        window.location.href = '/login';
    };

    return (
        <UserContext.Provider value={{ user, loginUser, updateUser, fetchUser, logout, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);