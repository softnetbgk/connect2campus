const { pool } = require('./src/config/db');
const { sendPushNotification } = require('./src/services/notificationService');

async function debug() {
    console.log('--- NOTIFICATION DEBUG START ---');

    // 1. Check if Firebase is available
    const firebase = require('./src/services/firebaseService');
    console.log('Firebase available:', !!firebase.sendPushNotification);

    // 2. Sample user (Change this to a real user ID or admission number to test)
    const testRecipientId = '1'; // Try looking for student ID 1
    const testRole = 'Student';

    console.log(`Testing push for ID: ${testRecipientId}, Role: ${testRole}`);

    try {
        const result = await sendPushNotification(testRecipientId, 'Debug Notification', 'Testing notification system', testRole);
        console.log('Result:', result);
    } catch (err) {
        console.error('Error in debug:', err);
    } finally {
        await pool.end();
        console.log('--- NOTIFICATION DEBUG END ---');
    }
}

debug();
