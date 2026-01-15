const { pool } = require('../config/db');

async function checkConstraints() {
    try {
        const res = await pool.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'announcements'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkConstraints();
