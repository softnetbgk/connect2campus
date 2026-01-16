const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from root of backend
const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
    console.error("❌ Failed to load .env file:", result.error);
} else {
    console.log("✅ .env file loaded successfully.");
    console.log("   GEMINI_API_KEY Present:", !!process.env.GEMINI_API_KEY);
    console.log("   EMAIL_USER Present:", !!process.env.EMAIL_USER);
}
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

        // Auto-run migrations (Schema Updates)
        try {
            await client.query(`
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenditures') THEN
                        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'expenditures' AND column_name = 'transaction_id') THEN
                            ALTER TABLE expenditures ADD COLUMN transaction_id VARCHAR(100);
                        END IF;
                        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'expenditures' AND column_name = 'upi_id') THEN
                            ALTER TABLE expenditures ADD COLUMN upi_id VARCHAR(100);
                        END IF;
                    END IF;
                END $$;
            `);

            await client.query(`
                DO $$ 
                BEGIN 
                    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'doubts') THEN
                        ALTER TABLE doubts ALTER COLUMN subject_id DROP NOT NULL;
                    END IF;
                END $$;
            `);

            await client.query(`
                ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo TEXT;
            `);
            console.log('✅ Database schema verified.');
        } catch (migError) {
            console.warn('⚠️ Some migrations could not be applied automatically:', migError.message);
        }

        // Auto-run migrations if needed (simple check)
        const check = await client.query("SELECT to_regclass('public.users')");
        if (!check.rows[0].to_regclass) {
            console.log('⚠️ Database seems empty. Running initialization...');
            const { createTables } = require('./scripts/initDb');
            await createTables(client);
        }

        client.release();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT} and accepting external connections`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(startServer, 5000);
    }
};

// Global Error Handlers to prevent crash
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down gracefully...');
    console.error(err.name, err.message, err.stack);
    // process.exit(1); // Do NOT exit, keep running if possible, or restart. For "don't crash" request, we log.
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥');
    console.error(err.name, err.message);
});

startServer();
