import React, { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const NotificationRegistration = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !Capacitor.isNativePlatform()) return;

        const setupNotifications = async () => {
            try {
                // Request permission
                let perm = await PushNotifications.checkPermissions();
                if (perm.receive !== 'granted') {
                    perm = await PushNotifications.requestPermissions();
                }

                if (perm.receive !== 'granted') return;

                // Register with FCM/APNS
                await PushNotifications.register();

                // Listen for successful registration
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Push Registration Success. Token:', token.value);
                    try {
                        await api.post('/auth/register-fcm', { token: token.value });
                    } catch (err) {
                        console.error('Failed to sync FCM token with backend', err);
                    }
                });

                // Listen for errors
                PushNotifications.addListener('registrationError', (err) => {
                    console.error('Push Registration Error:', err);
                });

                // Handle incoming notifications (Foreground)
                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Notification Received (Foreground):', notification);
                    // You could show a local toast here if you want
                });

                // Handle notification clicks
                PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
                    console.log('Notification Clicked:', action);
                    // Redirect logic can go here based on data in action.notification.data
                });

            } catch (error) {
                console.error('Notification Setup Failed:', error);
            }
        };

        setupNotifications();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [user]);

    return null; // Invisible component
};

export default NotificationRegistration;
