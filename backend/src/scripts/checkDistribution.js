const { pool } = require('../config/db');
const check = async () => {
    const res = await pool.query(`SELECT class_id, count(*) FROM marks WHERE year=2024 GROUP BY class_id`);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
};
check();
