const { pool } = require('../config/db');

async function checkSchema() {
    try {
        console.log('--- Users Table Schema ---');
        const users = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log("Users Columns:", users.rows.map(r => r.column_name));

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        pool.end();
    }
}

checkSchema();
