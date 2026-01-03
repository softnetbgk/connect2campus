const { pool } = require('../config/db');

const robustSeed = async () => {
    try {
        console.log('Fetching School ID...');
        const schoolRes = await pool.query('SELECT id FROM schools LIMIT 1');
        const school_id = schoolRes.rows[0].id;

        console.log('Fetching All Students...');
        // Only active students with valid class/section
        const students = (await pool.query(`
            SELECT id, class_id, section_id 
            FROM students 
            WHERE school_id = $1 AND class_id IS NOT NULL AND section_id IS NOT NULL
        `, [school_id])).rows;

        console.log('Fetching One Exam Type...');
        const examType = (await pool.query('SELECT id FROM exam_types WHERE school_id = $1 LIMIT 1', [school_id])).rows[0];

        if (!students.length || !examType) {
            console.log('No students or exam type found.');
            process.exit(0);
        }

        console.log(`Seeding marks for ${students.length} students across 2023 and 2024...`);
        let count = 0;

        for (const st of students) {
            // Fetch subjects for this student's class
            // Note: Subjects are usually linked to class, but for simplicity we rely on 'subjects' table.
            // Ideally should check class-subject mapping, but if global subjects exist:
            // Fetch subjects for this student's class
            const subjects = (await pool.query('SELECT id FROM subjects WHERE class_id = $1 LIMIT 5', [st.class_id])).rows;

            for (const year of [2023, 2024]) {
                for (const sub of subjects) {
                    try {
                        const marks = Math.floor(Math.random() * 60) + 30; // Random marks 30-90
                        const date = `${year}-05-20`;

                        await pool.query(`
                             INSERT INTO marks (
                                school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                                marks_obtained, year, created_at, updated_at
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                            ON CONFLICT (school_id, student_id, subject_id, exam_type_id, year)
                            DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained
                        `, [school_id, st.id, st.class_id, st.section_id, sub.id, examType.id, marks, year, date]);
                        // Only count success
                        count++;
                    } catch (e) {
                        // silently ignore
                    }
                }
            }
            console.log(`Processed student ${st.id}`);
        }

        console.log(`Seeding Complete. Upserted approx ${count} records.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

robustSeed();
