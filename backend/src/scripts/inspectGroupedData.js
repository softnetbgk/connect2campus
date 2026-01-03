const { pool } = require('../config/db');

const inspectData = async () => {
    try {
        console.log('--- Marks Data Sample (Year 2024 or 2023) ---');
        const res = await pool.query(`
            SELECT m.year, m.class_id, m.section_id, m.exam_type_id, count(*) 
            FROM marks m 
            WHERE m.year IN (2023, 2024)
            GROUP BY m.year, m.class_id, m.section_id, m.exam_type_id
        `);
        console.table(res.rows);

        console.log('--- Class Details ---');
        const classes = await pool.query(`SELECT id, name FROM classes`);
        console.log(JSON.stringify(classes.rows, null, 2));

        console.log('--- Section Details ---');
        const sections = await pool.query(`SELECT id, name FROM sections`);
        console.log(JSON.stringify(sections.rows, null, 2));

        console.log('--- Exam Details ---');
        const exams = await pool.query(`SELECT id, name FROM exam_types`);
        console.log(JSON.stringify(exams.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspectData();
