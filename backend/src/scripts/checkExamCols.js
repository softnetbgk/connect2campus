const { pool } = require('../config/db');
const check = async () => {
    const res = await pool.query(`SELECT * FROM exam_types LIMIT 1`);
    console.log(Object.keys(res.rows[0]));
    process.exit(0);
};
check();
