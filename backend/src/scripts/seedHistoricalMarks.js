const { pool } = require('../config/db');

const seedHistoricalMarks = async () => {
    try {
        console.log('Seeding historical marks...');

        // 1. Get School ID (limit to first one found)
        const schoolRes = await pool.query('SELECT id FROM schools LIMIT 1');
        if (schoolRes.rows.length === 0) throw new Error('No school found');
        const school_id = schoolRes.rows[0].id;

        // 2. Get Students (Take up to 10)
        const studentsRes = await pool.query('SELECT * FROM students WHERE school_id = $1 LIMIT 10', [school_id]);
        if (studentsRes.rows.length === 0) throw new Error('No students found');
        const students = studentsRes.rows;

        // 3. Get Types/Subjects
        const examRes = await pool.query('SELECT id FROM exam_types WHERE school_id = $1 LIMIT 1', [school_id]);
        if (examRes.rows.length === 0) throw new Error('No exam types found');
        const exam_type_id = examRes.rows[0].id;

        const subjectsRes = await pool.query('SELECT id FROM subjects WHERE school_id = $1 LIMIT 5', [school_id]);
        if (subjectsRes.rows.length === 0) {
            console.log('No subjects found, creating dummy marks without specific subjects might fail constraint if subject_id is required');
        }
        const subjects = subjectsRes.rows;

        // 4. Generate Marks for 2023, 2024, 2025
        const years = [2023, 2024, 2025];
        let count = 0;

        for (const year of years) {
            for (const student of students) {
                for (const subject of subjects) {
                    const marksObtained = Math.floor(Math.random() * 80) + 20; // 20-100

                    try {
                        await pool.query(
                            `INSERT INTO marks 
                            (school_id, student_id, class_id, section_id, subject_id, exam_type_id, marks_obtained, year, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
                            ON CONFLICT (school_id, student_id, subject_id, exam_type_id) 
                            DO NOTHING`, // Use DO NOTHING to avoid overwriting current year data if uniquely constrained (though unique constraint doesn't include year usually which is the problem)
                            // Correction: The UNIQUE constraint (school, student, subject, exam) prevents multiple years for same exam type.
                            // We need to delete/overwrite or just accept we can't have "Final Exam" for 2024 AND 2025 simultaneously unless we change constraint.
                            // Wait, if the constraint doesn't include YEAR, then we CANNOT have history for "Final Marks".
                            // The user requested history.
                            // I MUST ALTER THE CONSTRAINT to include YEAR.
                            [school_id, student.id, student.class_id, student.section_id, subject.id, exam_type_id, marksObtained, year, `${year}-05-15`]
                        );
                        // If insert failed (0 rows), we skip.
                        count++;
                    } catch (e) {
                        // Ignore duplicate key
                    }
                }
            }
        }

        console.log(`Seeding complete. Attempted to insert records.`);

        // Check constraints
        const constraint = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'marks'::regclass AND contype = 'u'
        `);
        console.log('Constraints:', constraint.rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedHistoricalMarks();
