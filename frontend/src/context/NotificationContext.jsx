import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user, authenticated } = useAuth(); // Use 'authenticated' or 'user' to check login status
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastNotificationIdRef = useRef(null);

    const fetchNotifications = async (showToast = false) => {
        if (!user) return;

        try {
            // Adjust URL based on your environment helper or hardcode if standard
            const res = await axios.get('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setNotifications(sorted);

            const unread = sorted.filter(n => !n.is_read).length;
            setUnreadCount(unread);

            // Toast for new notification
            if (showToast && sorted.length > 0) {
                const latest = sorted[0];
                if (lastNotificationIdRef.current && latest.id !== lastNotificationIdRef.current && !latest.is_read) {
                    toast(latest.message, {
                        icon: '🔔',
                        duration: 4000
                    });
                }
            }

            if (sorted.length > 0) {
                lastNotificationIdRef.current = sorted[0].id;
            }

        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Update local state optimistic
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`http://localhost:5000/api/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    // Poll for notifications
    useEffect(() => {
        if (authenticated && user) {
            fetchNotifications(false); // Initial fetch

            const interval = setInterval(() => {
                fetchNotifications(true); // Poll fetch
            }, 10000); // Check every 10 seconds

            return () => clearInterval(interval);
        }
    }, [authenticated, user]);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
