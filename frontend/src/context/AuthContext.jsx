import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load - Restore session from LocalStorage
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    // Broadcast Channel for Multi-tab management
    useEffect(() => {
        const channel = new BroadcastChannel('school_auth_channel');

        channel.onmessage = (event) => {
            if (event.data.type === 'LOGIN_SUCCESS') {
                if (user && event.data.userId === user.id) {
                    logout(false, true);
                    try { window.close(); } catch (e) { }
                }
            }
            if (event.data.type === 'LOGOUT') {
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

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);

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
                const channel = new BroadcastChannel('school_auth_channel');
                channel.postMessage({ type: 'LOGOUT', userId: user?.id });
                channel.close();

                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error("Logout API failed", error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            if (isAutoLogout) alert("Session timed out due to inactivity.");
        }
    };

    // Auto-logout: INCREASED to 24 hours for Mobile usability
    useEffect(() => {
        if (!user) return;

        // 24 Hours timeout (basically daily login required)
        const TIMEOUT_DURATION = 24 * 60 * 60 * 1000;
        let timeoutId;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                logout(true);
            }, TIMEOUT_DURATION);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer();

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
