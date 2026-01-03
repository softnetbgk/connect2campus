const { pool } = require('../config/db');

const checkStudentsData = async () => {
    try {
        console.log('\n👥 Checking Students Data:\n');

        // Total students
        const total = await pool.query('SELECT COUNT(*) FROM students');
        console.log(`Total students: ${total.rows[0].count}`);

        // Students by class/section
        const byClass = await pool.query(`
            SELECT class_id, section_id, COUNT(*) as count
            FROM students
            WHERE class_id IS NOT NULL AND section_id IS NOT NULL
            GROUP BY class_id, section_id
            ORDER BY class_id, section_id
        `);

        console.log('\nStudents by Class/Section:');
        console.log(JSON.stringify(byClass.rows, null, 2));

        // Check if students have marks for 2025
        const withMarks = await pool.query(`
            SELECT DISTINCT s.class_id, s.section_id, COUNT(DISTINCT s.id) as student_count
            FROM students s
            JOIN marks m ON s.id = m.student_id
            WHERE m.year = 2025
            GROUP BY s.class_id, s.section_id
            ORDER BY s.class_id, s.section_id
        `);

        console.log('\nStudents with 2025 marks by Class/Section:');
        console.log(JSON.stringify(withMarks.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkStudentsData();
