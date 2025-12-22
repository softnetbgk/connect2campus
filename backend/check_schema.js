
require('dotenv').config();
const { pool } = require('./src/config/db');

async function check() {
    try {
        console.log("Checking schema...");
        const res = await pool.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'section_id';
        `);
        console.log("Schema result:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("Error:", e);
    } finally {
        pool.end();
    }
}
check();
