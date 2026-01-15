const { pool } = require('../config/db');

async function checkConstraints() {
    try {
        console.log('--- Checking Constraints on Sections ---');
        const res = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conrelid = 'sections'::regclass;
        `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        pool.end();
    }
}

checkConstraints();
