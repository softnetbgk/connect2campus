const { pool } = require('../config/db');
const checkStudents = async () => {
    const res = await pool.query(`SELECT class_id, count(*) FROM students GROUP BY class_id`);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
};
checkStudents();
