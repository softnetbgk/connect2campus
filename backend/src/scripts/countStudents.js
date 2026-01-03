const { pool } = require('../config/db');
const count = async () => {
    try {
        const res = await pool.query('SELECT count(*) FROM students');
        console.log('Students:', res.rows[0].count);
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
};
count();
