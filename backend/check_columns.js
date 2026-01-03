const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migration = async () => {
    try {
        console.log('Checking Users table columns...');

        // Check reset_password_token
        const res1 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='reset_password_token';
    `);

        if (res1.rows.length === 0) {
            console.log('Adding reset_password_token column...');
            await pool.query('ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255);');
        } else {
            console.log('reset_password_token column already exists.');
        }

        // Check reset_password_expires
        const res2 = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='reset_password_expires';
    `);

        if (res2.rows.length === 0) {
            console.log('Adding reset_password_expires column...');
            await pool.query('ALTER TABLE users ADD COLUMN reset_password_expires BIGINT;');
        } else {
            console.log('reset_password_expires column already exists.');
        }

        // Check fcm_token (for push notifications)
        const res3 = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='fcm_token';
      `);

        if (res3.rows.length === 0) {
            console.log('Adding fcm_token column...');
            await pool.query('ALTER TABLE users ADD COLUMN fcm_token TEXT;');
        } else {
            console.log('fcm_token column already exists.');
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migration();
