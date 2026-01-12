const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkRefs() {
    const client = await pool.connect();
    try {
        console.log('Checking references to fee_structures table...');

        const res = await client.query(`
            SELECT
                conname AS constraint_name,
                conrelid::regclass AS table_nam,
                a.attname AS column_name
            FROM pg_constraint AS c
            JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
            WHERE confrelid = 'fee_structures'::regclass
        `);

        if (res.rows.length === 0) {
            console.log('No foreign keys found referencing fee_structures.');
        } else {
            console.log('Found tables referencing fee_structures:');
            res.rows.forEach(row => {
                console.log(`- Table: ${row.table_nam}, Column: ${row.column_name}, Constraint: ${row.constraint_name}`);
            });
        }

    } catch (err) {
        console.error('Error checking references:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkRefs();
