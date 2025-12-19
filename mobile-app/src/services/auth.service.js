import api from './api.service';
import { ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
    // Login
    login: async (email, password, role) => {
        try {
            const response = await api.post(ENDPOINTS.LOGIN, { email, password, role });
            const { token, user } = response.data;

            // Store auth data
            await AsyncStorage.multiSet([
                ['authToken', token],
                ['userData', JSON.stringify(user)],
                ['userRole', user.role],
                ['schoolId', (user.schoolId || user.school_id)?.toString() || ''],
            ]);

            return { success: true, user, token };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    },

    // Forgot Password
    forgotPassword: async (email, role) => {
        try {
            const response = await api.post('/auth/forgot-password', { email, role }); // Assuming endpoint is /auth/forgot-password
            return { success: true, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to request password reset'
            };
        }
    },

    // Logout
    logout: async () => {
        try {
            await AsyncStorage.multiRemove(['authToken', 'userData', 'userRole', 'schoolId']);
            return { success: true };
        } catch (error) {
            return { success: false, message: 'Logout failed' };
        }
    },

    // Get current user
    getCurrentUser: async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            return null;
        }
    },

    // Check if authenticated
    isAuthenticated: async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return !!token;
        } catch (error) {
            return false;
        }
    },
};
