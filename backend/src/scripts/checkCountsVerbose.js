const { pool } = require('../config/db');

const checkCountsVerbose = async () => {
    try {
        // Students Total
        const st = await pool.query('SELECT count(*) FROM students');

        // Students Active (with class/sec)
        const stActive = await pool.query('SELECT count(*) FROM students WHERE class_id IS NOT NULL AND section_id IS NOT NULL');

        // Students with NO subjects in their class
        const stNoSub = await pool.query(`
            SELECT count(*) 
            FROM students s 
            WHERE s.class_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM subjects sub WHERE sub.class_id = s.class_id)
        `);

        // Marks total
        const mTotal = await pool.query('SELECT count(*) FROM marks');
        const m2024 = await pool.query('SELECT count(*) FROM marks WHERE year = 2024');

        console.log({
            TotalStudents: st.rows[0].count,
            ActiveStudents: stActive.rows[0].count,
            StudentsNoSubjects: stNoSub.rows[0].count,
            TotalMarks: mTotal.rows[0].count,
            Marks2024: m2024.rows[0].count
        });
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
};
checkCountsVerbose();
