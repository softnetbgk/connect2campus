import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial load - Restore session from localStorage
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

    // Broadcast Channel for Multi-tab management (Web only)
    useEffect(() => {
        // Capacitor import is removed, so this check needs to be removed or handled differently if it's still relevant for web-only.
        // Assuming this check was primarily for Capacitor's native platform detection.
        // If this code is only for web, this check is no longer needed.
        // For now, I'll remove the check as per the instruction's implied simplification.
        // If the intent was to keep it web-only, a different check would be needed.
        // Given the context of removing Capacitor, this line becomes irrelevant.
        // if (Capacitor.isNativePlatform()) return; // Skip for mobile app

        let channel = null;
        try {
            channel = new BroadcastChannel('school_auth_channel');
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
        } catch (e) {
            console.warn('BroadcastChannel not supported');
        }

        return () => {
            if (channel) channel.close();
        };
    }, [user]);

    const login = async (email, password, role) => {
        try {
            const response = await api.post('/auth/login', { email, password, role });
            const { token, user } = response.data;

            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);

            // Broadcast
            try {
                const channel = new BroadcastChannel('school_auth_channel');
                channel.postMessage({ type: 'LOGIN_SUCCESS', userId: user.id });
                channel.close();
            } catch (bcError) {
                console.warn('BroadcastChannel suppressed:', bcError);
            }

            return { success: true, user };
        } catch (error) {
            console.error("Login failed", error);

            // Detailed error handling
            let errorMessage = 'Login failed';

            if (!error.response) {
                // Network error - no response from server
                if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    errorMessage = '⏱️ Connection timeout. Please check your internet connection and try again.';
                } else if (error.message.includes('Network Error')) {
                    errorMessage = '🌐 Cannot connect to server. Please check your internet connection.';
                } else {
                    errorMessage = '❌ Network error. Please check your connection and try again.';
                }
            } else if (error.response.status === 401) {
                // Authentication error
                errorMessage = '🔒 Invalid credentials. Please check your ID/Email and password.';
            } else if (error.response.status === 403) {
                // Authorization error
                errorMessage = '⛔ Access denied. Role mismatch or insufficient permissions.';
            } else if (error.response.status === 500) {
                // Server error
                errorMessage = '🔧 Server error. Please try again later or contact support.';
            } else if (error.response?.data?.message) {
                // Use server's error message if available
                errorMessage = error.response.data.message;
            }

            return {
                success: false,
                message: errorMessage
            };
        }
    };

    const logout = async (isAutoLogout = false, isRemote = false) => {
        try {
            if (!isRemote && !isAutoLogout) {
                // Broadcast
                try {
                    const channel = new BroadcastChannel('school_auth_channel');
                    channel.postMessage({ type: 'LOGOUT', userId: user?.id });
                    channel.close();
                } catch (e) { console.warn('BroadcastChannel suppressed inside logout'); }

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

    // NO AUTO-LOGOUT - Users stay logged in until they manually logout
    // This is better for mobile apps where users expect to stay logged in

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
