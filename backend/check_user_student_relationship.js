const { pool } = require('./src/config/db');

async function checkStudentUserRelationship() {
    try {
        // Check if students table has user_id column
        const studentsSchema = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'user_id'
        `);

        console.log('Students table has user_id column:', studentsSchema.rows.length > 0);

        // Check if there's a relationship between users and students
        const sample = await pool.query(`
            SELECT 
                u.id as user_id,
                u.email as user_email,
                u.role,
                s.id as student_id,
                s.name as student_name,
                s.email as student_email,
                s.admission_no
            FROM users u
            LEFT JOIN students s ON LOWER(u.email) = LOWER(s.email)
            WHERE u.role = 'STUDENT'
            LIMIT 5
        `);

        console.log('\nUser-Student relationship (via email):');
        console.log(JSON.stringify(sample.rows, null, 2));

        // Check if any students have matching user accounts
        const matchCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM users u
            INNER JOIN students s ON LOWER(u.email) = LOWER(s.email)
            WHERE u.role = 'STUDENT'
        `);

        console.log('\nTotal students with matching user accounts:', matchCount.rows[0].count);

        // Check total students vs total student users
        const studentCount = await pool.query('SELECT COUNT(*) FROM students WHERE status IS NULL OR status != \'Deleted\'');
        const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = \'STUDENT\'');

        console.log('\nTotal active students:', studentCount.rows[0].count);
        console.log('Total student user accounts:', userCount.rows[0].count);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkStudentUserRelationship();
