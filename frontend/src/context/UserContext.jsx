import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        first_name: '',
        last_name: '',
        avatar: null,
        email: '',
        designation: '',
        avatar_version: Date.now() // Initialize with a version
    });

    // Add a loading state to prevent flickering
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
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

    // --- MODIFIED updateUser FUNCTION ---
    const updateUser = (newData) => {
        setUser((prev) => ({
            ...prev,
            ...newData,
            // This adds a current timestamp whenever you update the profile.
            // It forces React to see the image URL as "new" immediately.
            avatar_version: Date.now()
        }));
    };

    // Added logout function since Header.js uses it
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, updateUser, fetchUser, logout, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);