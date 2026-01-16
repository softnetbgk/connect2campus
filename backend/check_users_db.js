const { pool } = require('./src/config/db');

async function listUsers() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT id, email, role, school_id FROM users');
        console.log('--- USERS IN DB ---');
        console.table(res.rows);
        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

listUsers();
