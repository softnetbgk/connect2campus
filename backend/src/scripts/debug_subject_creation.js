const { pool } = require('../config/db');

async function debugSubjectCreation() {
    try {
        console.log('--- Debugging Subject Creation ---');

        // 1. Get a valid class ID
        const classRes = await pool.query('SELECT id, name FROM classes LIMIT 1');
        if (classRes.rows.length === 0) {
            console.log('❌ No classes found.');
            return;
        }
        const classId = classRes.rows[0].id;
        console.log(`Using Class ID: ${classId}`);

        // 2. Try inserting a subject (This failed before migration)
        const subName = 'DebugSub_' + Date.now();
        console.log(`Attempting to insert subject: ${subName}`);

        const insertRes = await pool.query(
            'INSERT INTO subjects (class_id, name, code, type) VALUES ($1, $2, $3, $4) RETURNING *',
            [classId, subName, 'D101', 'Practical']
        );
        console.log('✅ Subject Created:', insertRes.rows[0]);

        // Cleanup
        await pool.query('DELETE FROM subjects WHERE id = $1', [insertRes.rows[0].id]);
        console.log('✅ Cleaned up.');

    } catch (error) {
        console.error('❌ FAILED:', error.message);
    } finally {
        pool.end();
    }
}

debugSubjectCreation();
