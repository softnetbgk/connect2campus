const { pool } = require('../config/db');

const checkCounts = async () => {
    try {
        const students = await pool.query('SELECT count(*) FROM students');
        const activeStudents = await pool.query('SELECT count(*) FROM students WHERE class_id IS NOT NULL AND section_id IS NOT NULL');

        console.log('Total Students:', students.rows[0].count);
        console.log('Active Students (with valid class/section):', activeStudents.rows[0].count);

        const marks2024 = await pool.query('SELECT count(*) FROM marks WHERE year = 2024');
        console.log('Marks in 2024:', marks2024.rows[0].count);

        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
};
checkCounts();
