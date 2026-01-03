const { pool } = require('../config/db');

const seedFast = async () => {
    try {
        const school_id = (await pool.query('SELECT id FROM schools LIMIT 1')).rows[0].id;
        // Limit to 2 students
        const students = (await pool.query(`
            SELECT id, class_id, section_id FROM students 
            WHERE school_id = $1 AND class_id IS NOT NULL AND section_id IS NOT NULL 
            LIMIT 2
        `, [school_id])).rows;
        const subjects = (await pool.query('SELECT id FROM subjects LIMIT 2')).rows;
        const examType = (await pool.query('SELECT id FROM exam_types LIMIT 1')).rows[0];

        console.log(`Seeding for ${students.length} students...`);

        let count = 0;
        for (const st of students) {
            for (const year of [2023, 2024]) {
                for (const sub of subjects) {
                    try {
                        const marks = Math.floor(Math.random() * 50) + 40;
                        await pool.query(`
                            INSERT INTO marks (
                                school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                                marks_obtained, year, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                        `, [school_id, st.id, st.class_id, st.section_id, sub.id, examType.id, marks, year]);
                        process.stdout.write('.');
                        count++;
                    } catch (e) {
                        process.stdout.write('x');
                    }
                }
            }
        }
        console.log(`\nDone. Inserted ${count}.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedFast();
