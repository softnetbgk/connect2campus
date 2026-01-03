const { pool } = require('../config/db');

const seedVerified = async () => {
    try {
        console.log('Fetching School...');
        const sRes = await pool.query('SELECT id FROM schools LIMIT 1');
        const school_id = sRes.rows[0].id;

        console.log('Fetching Students...');
        const stRes = await pool.query('SELECT id, class_id, section_id FROM students WHERE school_id = $1 AND class_id IS NOT NULL AND section_id IS NOT NULL', [school_id]);
        const students = stRes.rows;

        console.log('Fetching Subjects...');
        const subRes = await pool.query('SELECT id FROM subjects LIMIT 3');
        const subjects = subRes.rows;

        console.log('Fetching Exam Types...');
        const etRes = await pool.query('SELECT id FROM exam_types LIMIT 1');
        const examType = etRes.rows[0];

        if (!students.length || !subjects.length || !examType) {
            console.log('Insufficient data');
            process.exit(0);
        }

        console.log('Starting Insert Loop...');
        let inserted = 0;
        for (const year of [2023, 2024]) {
            for (const st of students) {
                for (const sub of subjects) {
                    try {
                        const marks = Math.floor(Math.random() * 50) + 40;
                        const date = `${year}-05-15`;

                        await pool.query(`
                            INSERT INTO marks (
                                school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                                marks_obtained, year, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                        `, [school_id, st.id, st.class_id, st.section_id, sub.id, examType.id, marks, year, date]);
                        inserted++;
                    } catch (e) {
                        // ignore failures for speed
                    }
                }
            }
        }
        console.log(`Done. Inserted ${inserted} records.`);
        process.exit(0);
    } catch (e) {
        console.error('Fatal:', e);
        process.exit(1);
    }
};

seedVerified();
