const { pool } = require('../config/db');

const countYears = async () => {
    try {
        const res = await pool.query(`SELECT year, count(*) FROM marks GROUP BY year`);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
};
countYears();
