const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function findConstraints() {
    const client = await pool.connect();
    try {
        console.log('🔍 Finding all tables referencing "students"...');

        const query = `
            SELECT
                tc.table_name,
                kcu.column_name,
                tc.constraint_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.referential_constraints AS rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.constraint_name IN (
                  SELECT constraint_name
                  FROM information_schema.constraint_column_usage
                  WHERE table_name = 'students'
              )
            ORDER BY tc.table_name;
        `;

        const res = await client.query(query);

        console.log('\n📋 Found references in these tables:');
        console.log('----------------------------------------');
        const tables = new Set();

        res.rows.forEach(row => {
            console.log(`• Table: ${row.table_name.padEnd(25)} | Column: ${row.column_name}`);
            tables.add(row.table_name);
        });

        console.log('\n❌ Tables we are NOT deleting yet:');
        const knownTables = [
            'marks', 'mark_components', 'attendance', 'student_attendance',
            'fee_payments', 'student_fees', 'hostel_payments', 'hostel_mess_bills',
            'hostel_allocations', 'transport_allocations', 'leave_requests',
            'student_promotions', 'student_certificates', 'doubts',
            'doubt_replies', 'library_transactions', 'notifications'
        ];

        let missing = false;
        tables.forEach(table => {
            if (!knownTables.includes(table)) {
                console.log(`⚠️ MISSING DELETION FOR: ${table}`);
                missing = true;
            }
        });

        if (!missing) {
            console.log('✅ We are covering all known tables. The issue might be a trigger or something else.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

findConstraints();
