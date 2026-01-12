const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
    ssl: { rejectUnauthorized: false }
});

async function fixSchema() {
    const client = await pool.connect();
    try {
        console.log('Fixing school_holidays schema...');

        // 1. Remove duplicates
        console.log('Removing duplicate holidays...');
        await client.query(`
            DELETE FROM school_holidays a 
            USING school_holidays b 
            WHERE a.ctid < b.ctid 
            AND a.school_id = b.school_id 
            AND a.holiday_date = b.holiday_date
        `);
        console.log('Duplicates removed (if any).');

        // 2. Add Unique Constraint
        console.log('Adding Unique Constraint...');
        try {
            await client.query(`
                ALTER TABLE school_holidays 
                ADD CONSTRAINT unique_school_holiday UNIQUE (school_id, holiday_date)
            `);
            console.log('Constraint added successfully.');
        } catch (err) {
            if (err.code === '42710') { // duplicate_object
                console.log('Constraint already exists.');
            } else {
                console.error('Error adding constraint:', err.message);

                // Fallback: Check if constraint exists with different name?
                // For now, if adding fails and not duplicate, it's an issue.
            }
        }

    } catch (error) {
        console.error('Script failed:', error);
    } finally {
        client.release();
        pool.end();
    }
}

fixSchema();
