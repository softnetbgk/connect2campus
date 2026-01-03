const { pool } = require('../config/db');
const fs = require('fs');

const seedDebug = async () => {
    try {
        const school_id = (await pool.query('SELECT id FROM schools LIMIT 1')).rows[0].id;
        const student = (await pool.query('SELECT * FROM students LIMIT 1')).rows[0];
        const subject = (await pool.query('SELECT id FROM subjects LIMIT 1')).rows[0];
        const exam = (await pool.query('SELECT id FROM exam_types LIMIT 1')).rows[0];

        console.log('Attempting single insert...');

        try {
            await pool.query(`
                INSERT INTO marks (
                    school_id, student_id, class_id, section_id, subject_id, exam_type_id, 
                    marks_obtained, year
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [school_id, student.id, student.class_id, student.section_id, subject.id, exam.id, 50, 2022]);
            console.log('Success!');
        } catch (insertError) {
            console.log('Insert Error:', insertError);
            fs.writeFileSync('insert_error.log', JSON.stringify(insertError, null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error('Setup Error:', e);
        process.exit(1);
    }
};

seedDebug();
