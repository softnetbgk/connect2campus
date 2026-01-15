const { pool } = require('./src/config/db');

async function checkIndexes() {
    try {
        console.log('--- Database Performance Audit ---');

        // List of critical indexes we want to ensure exist
        const criticalIndexes = [
            { table: 'users', column: 'email', name: 'idx_users_email' },
            { table: 'users', column: 'school_id', name: 'idx_users_school_id' },
            { table: 'students', column: 'admission_no', name: 'idx_students_admission_no' },
            { table: 'students', column: 'school_id', name: 'idx_students_school_id' },
            { table: 'students', column: 'class_id', name: 'idx_students_class_id' },
            { table: 'teachers', column: 'employee_id', name: 'idx_teachers_employee_id' },
            { table: 'teachers', column: 'school_id', name: 'idx_teachers_school_id' },
            { table: 'student_attendance', column: 'date', name: 'idx_attendance_date' },
            { table: 'student_attendance', column: 'student_id', name: 'idx_attendance_student_id' },
            { table: 'notifications', column: 'user_id', name: 'idx_notifications_user_id' },
            { table: 'notifications', column: 'is_read', name: 'idx_notifications_is_read' },
            { table: 'announcements', column: 'school_id', name: 'idx_announcements_school_id' },
            { table: 'fee_payments', column: 'student_id', name: 'idx_fee_payments_student_id' }
        ];

        for (const idx of criticalIndexes) {
            try {
                process.stdout.write(`Checking ${idx.name}... `);
                await pool.query(`CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} (${idx.column})`);
                console.log('✅ OK');
            } catch (err) {
                console.error(`❌ FAILED: ${err.message}`);
            }
        }

        console.log('\n--- VACUUM ANALYZE (Optimizing Query Planner) ---');
        await pool.query('VACUUM ANALYZE');
        console.log('✅ Database stats updated.');

        console.log('\n🚀 SPEED PATCH APPLIED SUCCESSFULLY');
        process.exit(0);
    } catch (error) {
        console.error('Audit failed:', error);
        process.exit(1);
    }
}

checkIndexes();
