const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkRefs() {
    const client = await pool.connect();
    try {
        console.log('Checking references to student_fees table...');
        const res = await client.query(`
            SELECT conname, conrelid::regclass AS table_nam, a.attname AS column_name
            FROM pg_constraint AS c
            JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
            WHERE confrelid = 'student_fees'::regclass
        `);
        res.rows.forEach(row => console.log(`- Table: ${row.table_nam}, Col: ${row.column_name}`));

    } catch (err) { console.error(err); } finally { client.release(); pool.end(); }
}
checkRefs();
