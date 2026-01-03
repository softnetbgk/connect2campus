const { pool } = require('../config/db');

const seedFinal = async () => {
    try {
        const school_id = (await pool.query('SELECT id FROM schools LIMIT 1')).rows[0].id;
        const students = (await pool.query('SELECT * FROM students WHERE school_id = $1 LIMIT 5', [school_id])).rows;
        const subjects = (await pool.query('SELECT id FROM subjects WHERE school_id = $1 LIMIT 4', [school_id])).rows;
        const examType = (await pool.query('SELECT id FROM exam_types WHERE school_id = $1 LIMIT 1', [school_id])).rows[0];

        if (!students.length || !subjects.length || !examType) {
            console.log('Not enough data.');
            process.exit(0);
        }

        console.log(`Seeding ${students.length} students across 2023, 2024...`);
        let count = 0;

        for (const year of [2023, 2024]) {
            for (const st of students) {
                for (const sub of subjects) {
                    const marks = Math.floor(Math.random() * 60) + 30;
                    try {
                        const date = `${year}-05-20`;
                        await pool.query(`
                            INSERT INTO marks (
                                school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                                marks_obtained, year, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                        `, [school_id, st.id, st.class_id, st.section_id, sub.id, examType.id, marks, year, date]);
                        count++;
                    } catch (e) {
                        if (e.code === '23505') {
                            // duplicate, ignore
                        } else {
                            console.error('Insert failed:', e.message);
                        }
                    }
                }
            }
        }
        console.log(`Seeding process finished. Processed ${count} attempts.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedFinal();
