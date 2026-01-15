const { pool } = require('../config/db');

async function debugSectionCreation() {
    try {
        console.log('--- Debugging Section Creation ---');

        // 1. Get a valid class ID
        const classRes = await pool.query('SELECT id, name FROM classes LIMIT 1');
        if (classRes.rows.length === 0) {
            console.log('❌ No classes found to test with.');
            return;
        }
        const classId = classRes.rows[0].id;
        console.log(`Using Class ID: ${classId} (${classRes.rows[0].name})`);

        // 2. Inspect table constraints and defaults
        const schemaRes = await pool.query(`
            SELECT column_name, column_default, is_nullable, data_type
            FROM information_schema.columns 
            WHERE table_name = 'sections';
        `);
        console.log('\nTable Structure:');
        console.table(schemaRes.rows.map(row => ({
            col: row.column_name,
            type: row.data_type,
            default: row.column_default,
            nullable: row.is_nullable
        })));

        // 3. Try to insert a test section
        const testName = 'TestSection_' + Date.now();
        console.log(`\nAttempting to insert section: "${testName}" for class ${classId}...`);

        const insertRes = await pool.query(
            'INSERT INTO sections (class_id, name) VALUES ($1, $2) RETURNING *',
            [classId, testName]
        );
        console.log('✅ Insert Successful:', insertRes.rows[0]);

        // Clean up
        await pool.query('DELETE FROM sections WHERE id = $1', [insertRes.rows[0].id]);
        console.log('✅ Cleaned up test record.');

    } catch (error) {
        console.log('\n❌ INSERT FAILED!');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        console.error('Detail:', error.detail);
    } finally {
        pool.end();
    }
}

debugSectionCreation();
