import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password, role) => {
        try {
            const response = await api.post('/auth/login', { email, password, role });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = async (isAutoLogout = false) => {
        try {
            if (!isAutoLogout) {
                // Only call API if it's a manual logout or we want to ensure server session is killed
                // For auto-logout we definitely want to kill server session too, so we keep it.
                // Actually, logic is same.
            }
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout API failed", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            if (isAutoLogout) alert("Session timed out due to inactivity.");
        }
    };

    // Auto-logout on inactivity
    useEffect(() => {
        if (!user) return;

        const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes
        let timeoutId;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                logout(true);
            }, TIMEOUT_DURATION);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer(); // Start timer

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
