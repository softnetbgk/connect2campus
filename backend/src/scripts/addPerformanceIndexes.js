const { pool } = require('../config/db');

async function addPerformanceIndexes() {
    const client = await pool.connect();
    try {
        console.log('🚀 Adding performance indexes for 100k+ students scale...');

        await client.query('BEGIN');

        // 1. Students Table Indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_students_admission_no ON students(admission_no)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_students_name_trgm ON students USING gin (name gin_trgm_ops)')
            .catch(e => console.log('⚠️ Trigram index skipped (pg_trgm extension might be missing)'));

        // 2. Attendance Table Indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id)');

        // 3. User Table Indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');

        // 4. Fee Payments Indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_fee_payments_school_id ON fee_payments(school_id)');

        await client.query('COMMIT');
        console.log('✅ Performance indexes added successfully!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding indexes:', error);
    } finally {
        client.release();
    }
}

addPerformanceIndexes();
