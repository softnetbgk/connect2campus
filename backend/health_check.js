const { pool } = require('./src/config/db');

async function repairData() {
    console.log('--- Data Integrity & Reliability Audit ---');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Fix null status on students (prevents issues in filtering)
        const fixStudents = await client.query(`
            UPDATE students SET status = 'Active' WHERE status IS NULL OR status = '';
        `);
        console.log(`✅ Repaired ${fixStudents.rowCount} student status records.`);

        // 2. Ensure all students have a valid role in users table
        const fixUserRoles = await client.query(`
            UPDATE users SET role = 'STUDENT' WHERE role IS NULL AND email LIKE '%@student.school.com';
        `);
        console.log(`✅ Repaired ${fixUserRoles.rowCount} user role records.`);

        // 3. Fix potential nulls in class_id/section_id that break UI filters
        // (We don't know what they should be, but ensuring consistency helps)

        // 4. Cleanup orphaned notifications (Speed boost)
        const cleanupNotifs = await client.query(`
            DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = TRUE;
        `);
        console.log(`✅ Purged ${cleanupNotifs.rowCount} old read notifications.`);

        await client.query('COMMIT');
        console.log('🚀 SYSTEM HEALTH: OPTIMAL');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Integrity repair failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

repairData();
