const { pool } = require('./src/config/db');

async function checkStudentsSchema() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'students' 
            ORDER BY ordinal_position
        `);

        console.log('Students table schema:');
        console.log(JSON.stringify(result.rows, null, 2));

        // Check if there's a user_id column
        const hasUserId = result.rows.some(col => col.column_name === 'user_id');
        console.log('\nHas user_id column:', hasUserId);

        // Check sample student data
        const students = await pool.query('SELECT id, name, email, admission_no FROM students LIMIT 3');
        console.log('\nSample students:');
        console.log(JSON.stringify(students.rows, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkStudentsSchema();
