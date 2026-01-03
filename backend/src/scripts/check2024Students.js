const { pool } = require('../config/db');

const check2024Students = async () => {
    try {
        const res = await pool.query(`
            SELECT m.student_id, count(*) 
            FROM marks m 
            WHERE m.year = 2024
            GROUP BY m.student_id
        `);
        console.log(`Students with marks in 2024: ${res.rows.length}`);
        console.log(JSON.stringify(res.rows.slice(0, 5), null, 2));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
};
check2024Students();
