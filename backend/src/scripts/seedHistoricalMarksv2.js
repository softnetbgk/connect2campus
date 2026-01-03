const { pool } = require('../config/db');

const seed = async () => {
    try {
        // Double check columns
        const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'marks'`);
        const validCols = cols.rows.map(r => r.column_name);
        // console.log('Valid Columns:', validCols); // debugging

        // Get basic data
        const schoolRes = await pool.query('SELECT id FROM schools LIMIT 1');
        const school_id = schoolRes.rows[0].id;

        const students = (await pool.query('SELECT * FROM students WHERE school_id = $1 LIMIT 5', [school_id])).rows;
        const examType = (await pool.query('SELECT id FROM exam_types WHERE school_id = $1 LIMIT 1', [school_id])).rows[0];
        const subjects = (await pool.query('SELECT id FROM subjects WHERE school_id = $1 LIMIT 4', [school_id])).rows;

        if (!students.length || !examType || !subjects.length) {
            console.log('Not enough data to seed.');
            process.exit(0);
        }

        console.log(`Seeding for ${students.length} students, ${subjects.length} subjects...`);

        // Seed 2024 and 2023
        for (const year of [2023, 2024]) {
            for (const st of students) {
                for (const sub of subjects) {
                    const marks = Math.floor(Math.random() * 60) + 30;

                    // Construct Query based on valid columns checks (implicit)
                    // Assuming columns exist as standard.
                    await pool.query(`
                        INSERT INTO marks (
                            school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                            marks_obtained, year, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                        ON CONFLICT (school_id, student_id, subject_id, exam_type_id, year)
                        DO NOTHING
                    `, [school_id, st.id, st.class_id, st.section_id, sub.id, examType.id, marks, year, `${year}-05-20`]);
                }
            }
        }

        console.log('Seeding Complete.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seed();
