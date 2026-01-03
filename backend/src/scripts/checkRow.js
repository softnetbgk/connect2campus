const { pool } = require('../config/db');

const checkRow = async () => {
    try {
        const res = await pool.query(`SELECT * FROM marks LIMIT 1`);
        console.log(Object.keys(res.rows[0]));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
checkRow();
