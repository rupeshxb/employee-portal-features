import React, { createContext, useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        first_name: '',
        last_name: '',
        avatar: null,
        email: '',
        designation: ''
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
                setUser(data);
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

    // Call this function whenever you update the profile
    const updateUser = (newData) => {
        setUser((prev) => ({ ...prev, ...newData }));
    };

    return (
        <UserContext.Provider value={{ user, updateUser, fetchUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);