const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let messaging = null;

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        messaging = admin.messaging();
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
    }
} else {
    console.log('Firebase Service Account Key not found. Push notifications will be logged to console only.');
}

/**
 * Send push notification to a specific token
 */
const sendPushNotification = async (token, title, body, data = {}) => {
    if (!token) return;

    const message = {
        notification: {
            title,
            body
        },
        data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard for Android
        },
        token
    };

    if (messaging) {
        try {
            const response = await messaging.send(message);
            console.log('Successfully sent push notification:', response);
            return response;
        } catch (error) {
            console.error('Error sending push notification:', error);
            // If token is invalid, we might want to remove it from DB
            return null;
        }
    } else {
        console.log('--- PUSH NOTIFICATION (LOG ONLY) ---');
        console.log(`To: ${token}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log('------------------------------------');
        return 'LOGGED';
    }
};

module.exports = {
    sendPushNotification
};
