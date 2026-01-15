require('dotenv').config();
const { pool } = require('./src/config/db');

async function debugLatest() {
    const client = await pool.connect();
    try {
        console.log("--- LATEST 10 ANNOUNCEMENTS ---");
        const res = await client.query(`
            SELECT id, title, target_role, class_id, section_id, created_at 
            FROM announcements 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

debugLatest();
