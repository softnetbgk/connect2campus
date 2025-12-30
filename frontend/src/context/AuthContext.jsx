import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load - Strict Security: Do NOT restore session on refresh.
    useEffect(() => {
        // Clearing session storage to ensure clean state if it was there
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setLoading(false);
    }, []);

    // Broadcast Channel for Multi-tab management
    useEffect(() => {
        const channel = new BroadcastChannel('school_auth_channel');

        channel.onmessage = (event) => {
            if (event.data.type === 'LOGIN_SUCCESS') {
                // Only logout if the NEW login is for the SAME user account
                // This allows an Admin to be logged in one tab and a Student in another
                if (user && event.data.userId === user.id) {
                    logout(false, true); // remote logout
                    try { window.close(); } catch (e) { }
                }
            }
            if (event.data.type === 'LOGOUT') {
                // If specific user ID is passed, only logout that user, otherwise global logout?
                // For safety, let's keep logout specific too
                if (user && event.data.userId === user.id) {
                    logout(false, true);
                }
            }
        };

        return () => {
            channel.close();
        };
    }, [user]);

    const login = async (email, password, role) => {
        try {
            const response = await api.post('/auth/login', { email, password, role });
            const { token, user } = response.data;

            sessionStorage.setItem('token', token);
            sessionStorage.setItem('user', JSON.stringify(user));
            setUser(user);

            // Broadcast login to other tabs with User ID
            const channel = new BroadcastChannel('school_auth_channel');
            channel.postMessage({ type: 'LOGIN_SUCCESS', userId: user.id });
            channel.close();

            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = async (isAutoLogout = false, isRemote = false) => {
        try {
            if (!isRemote && !isAutoLogout) {
                // Only broadcast if WE initiated the logout
                const channel = new BroadcastChannel('school_auth_channel');
                channel.postMessage({ type: 'LOGOUT', userId: user?.id });
                channel.close();

                // Call API
                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error("Logout API failed", error);
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
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
