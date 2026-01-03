const { pool } = require('../config/db');
const checkSubjects = async () => {
    const res = await pool.query(`SELECT class_id, count(*) FROM subjects GROUP BY class_id`);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
};
checkSubjects();
