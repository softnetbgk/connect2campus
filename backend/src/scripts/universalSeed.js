const { pool } = require('../config/db');

const universalSeed = async () => {
    try {
        console.log('Starting Global Universal Seed...');

        // 1. Get ALL Active Students
        const students = (await pool.query(`
            SELECT id, school_id, class_id, section_id 
            FROM students 
            WHERE class_id IS NOT NULL AND section_id IS NOT NULL
        `)).rows;

        console.log(`Found ${students.length} active students across all schools.`);

        let count = 0;

        for (const st of students) {
            // 2. Get Exam Type for THIS student's school
            const examRes = await pool.query('SELECT id FROM exam_types WHERE school_id = $1 LIMIT 1', [st.school_id]);
            if (examRes.rows.length === 0) {
                console.log(`Student ${st.id} School ${st.school_id} No Exam Types`);
                continue; // Skip if no exam types defined for this school
            }
            const examTypeId = examRes.rows[0].id;

            // 3. Get Subjects for THIS student's class
            const subjects = (await pool.query('SELECT id FROM subjects WHERE class_id = $1', [st.class_id])).rows;

            if (subjects.length === 0) {
                console.log(`Student ${st.id} Class ${st.class_id} No Subjects`);
                continue;
            }

            for (const year of [2023, 2024, 2025]) {
                for (const sub of subjects) {
                    try {
                        const marks = Math.floor(Math.random() * 60) + 35;
                        const date = `${year}-05-15`;

                        await pool.query(`
                            INSERT INTO marks (
                                school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                                marks_obtained, year, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                            ON CONFLICT (school_id, student_id, subject_id, exam_type_id, year)
                            DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained
                        `, [st.school_id, st.id, st.class_id, st.section_id, sub.id, examTypeId, marks, year, date]);
                        count++;
                    } catch (e) {
                        console.error('Error inserting marks:', e.message);
                    }
                }
            }
        }

        console.log(`Seeding Complete. Upserted ${count} marks.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

universalSeed();
