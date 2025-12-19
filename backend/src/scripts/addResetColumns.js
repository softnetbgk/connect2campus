const { pool } = require('../config/db');

async function addResetColumns() {
    try {
        const client = await pool.connect();
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_password_expires BIGINT;
    `);
        console.log('Columns added successfully');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('Error adding columns:', err);
        process.exit(1);
    }
}

addResetColumns();
