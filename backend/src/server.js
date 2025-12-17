require('dotenv').config();
const app = require('./app');
const { pool } = require('./config/db');

const cron = require('node-cron');
const { checkAndSendAbsentNotifications } = require('./services/notificationService');

// Schedule Absentee Check at 10:00 AM every day
cron.schedule('0 10 * * *', () => {
    checkAndSendAbsentNotifications();
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Test DB connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');

        // Auto-run migrations if needed (simple check)
        const check = await client.query("SELECT to_regclass('public.users')");
        if (!check.rows[0].to_regclass) {
            console.log('⚠️ Database seems empty. Running initialization...');
            const { createTables } = require('./scripts/initDb');
            await createTables(client);
        }

        client.release();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

startServer();
