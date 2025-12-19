import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            const authenticated = await authService.isAuthenticated();
            setUser(currentUser);
            setIsAuthenticated(authenticated);
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password, role) => {
        const result = await authService.login(email, password, role);
        if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);
        }
        return result;
    };

    const logout = async () => {
        const result = await authService.logout();
        if (result.success) {
            setUser(null);
            setIsAuthenticated(false);
        }
        return result;
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
