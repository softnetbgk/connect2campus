const { pool } = require('../config/db');

const trySeed = async () => {
    try {
        const school_id = (await pool.query('SELECT id FROM schools LIMIT 1')).rows[0].id;
        const students = (await pool.query('SELECT id, class_id, section_id FROM students WHERE school_id = $1 AND class_id IS NOT NULL LIMIT 1', [school_id])).rows;
        const subjects = (await pool.query('SELECT id FROM subjects LIMIT 1')).rows;
        const examType = (await pool.query('SELECT id FROM exam_types LIMIT 1')).rows[0];

        if (!students.length) { console.log('No students'); process.exit(0); }

        console.log('Inserting 1 record...');
        try {
            await pool.query(`
                INSERT INTO marks (
                    school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                    marks_obtained, year, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [school_id, students[0].id, students[0].class_id, students[0].section_id, subjects[0].id, examType.id, 99, 2024]);
            console.log('Success 2024');
        } catch (e) {
            console.log('Error:', e.code, e.message, e.detail);
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
trySeed();
