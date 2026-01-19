const { pool } = require('./src/config/db');

async function testStudentLogin() {
    try {
        // Get a sample student
        const students = await pool.query(`
            SELECT id, name, email, admission_no, class_id, section_id, school_id, status
            FROM students 
            WHERE status IS NULL OR status != 'Deleted'
            LIMIT 5
        `);

        console.log('Sample students:');
        console.log(JSON.stringify(students.rows, null, 2));

        if (students.rows.length > 0) {
            const student = students.rows[0];
            console.log('\n=== Testing data retrieval for student:', student.name, '===');

            // Test 1: Get student profile
            const profile = await pool.query(`
                SELECT s.*, c.name as class_name, sec.name as section_name 
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                LEFT JOIN sections sec ON s.section_id = sec.id
                WHERE s.id = $1 AND s.school_id = $2 AND (s.status IS NULL OR s.status != 'Deleted')
            `, [student.id, student.school_id]);

            console.log('\n1. Profile data:', profile.rows.length > 0 ? 'Found' : 'NOT FOUND');
            if (profile.rows.length > 0) {
                console.log('   Class:', profile.rows[0].class_name);
                console.log('   Section:', profile.rows[0].section_name);
            }

            // Test 2: Get student marks
            const marks = await pool.query(`
                SELECT * FROM marks WHERE student_id = $1 LIMIT 5
            `, [student.id]);

            console.log('\n2. Marks records:', marks.rows.length);

            // Test 3: Get student fees
            const fees = await pool.query(`
                SELECT * FROM fees WHERE student_id = $1
            `, [student.id]);

            console.log('\n3. Fees records:', fees.rows.length);

            // Test 4: Get student attendance
            const attendance = await pool.query(`
                SELECT * FROM attendance WHERE student_id = $1 LIMIT 5
            `, [student.id]);

            console.log('\n4. Attendance records:', attendance.rows.length);

            // Test 5: Check if student has a user account
            const userAccount = await pool.query(`
                SELECT id, email, role FROM users WHERE email = $1
            `, [student.email]);

            console.log('\n5. User account:', userAccount.rows.length > 0 ? 'EXISTS' : 'NOT FOUND');
            if (userAccount.rows.length > 0) {
                console.log('   User ID:', userAccount.rows[0].id);
                console.log('   Role:', userAccount.rows[0].role);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

testStudentLogin();
