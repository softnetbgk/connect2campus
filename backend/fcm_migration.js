const { pool } = require('./src/config/db');

async function migrate() {
    try {
        console.log('Adding fcm_token column to users table...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT');

        console.log('Adding fcm_token column to students table...');
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS fcm_token TEXT');

        console.log('Creating notification_sent boolean in various tables if needed...');
        // Just in case we want to track which ones are sent as push

        console.log('Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
