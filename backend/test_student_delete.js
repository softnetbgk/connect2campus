// Test script to check what's preventing student deletion
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'school_management',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

async function testStudentDeletion(studentId) {
    const client = await pool.connect();

    try {
        console.log(`Testing deletion for student ID: ${studentId}`);

        // Try to delete the student directly
        const result = await client.query('DELETE FROM students WHERE id = $1 RETURNING *', [studentId]);

        if (result.rows.length > 0) {
            console.log('✅ Student can be deleted directly (no FK constraints)');
            console.log('Student:', result.rows[0]);
        } else {
            console.log('❌ Student not found');
        }

    } catch (error) {
        console.log('❌ Cannot delete student directly');
        console.log('Error:', error.message);
        console.log('Detail:', error.detail);
        console.log('Constraint:', error.constraint);
        console.log('Table:', error.table);

        // Now check which tables reference this student
        console.log('\n📋 Checking which tables have references to this student...\n');

        const tables = [
            'marks', 'mark_components', 'attendance', 'student_attendance',
            'fee_payments', 'student_fees', 'hostel_payments', 'hostel_mess_bills',
            'hostel_allocations', 'transport_allocations', 'student_promotions',
            'student_certificates', 'doubts', 'leave_requests'
        ];

        for (const table of tables) {
            try {
                const count = await client.query(`SELECT COUNT(*) FROM ${table} WHERE student_id = $1`, [studentId]);
                if (parseInt(count.rows[0].count) > 0) {
                    console.log(`  - ${table}: ${count.rows[0].count} records`);
                }
            } catch (e) {
                // Table might not exist
            }
        }
    } finally {
        client.release();
        pool.end();
    }
}

// Get student ID from command line or use default
const studentId = process.argv[2] || 33;
testStudentDeletion(studentId);
