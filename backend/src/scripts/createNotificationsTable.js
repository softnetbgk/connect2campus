const { pool } = require('../config/db');

const createNotificationsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating notifications table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'INFO',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Notifications table created successfully.');
    } catch (error) {
        console.error('Error creating notifications table:', error);
    } finally {
        client.release();
        pool.end();
    }
};

createNotificationsTable();
