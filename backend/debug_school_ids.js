require('dotenv').config();
const { pool } = require('./src/config/db');

async function debugSchoolIds() {
    const client = await pool.connect();
    try {
        console.log("--- ANNOUNCEMENTS SCHOOL_ID CHECK ---");
        const res = await client.query("SELECT id, title, school_id, target_role FROM announcements ORDER BY id DESC LIMIT 10");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

debugSchoolIds();
