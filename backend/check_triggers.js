require('dotenv').config();
const { pool } = require('./src/config/db');

async function checkTriggers() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'announcements'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

checkTriggers();
