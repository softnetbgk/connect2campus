const { pool } = require('../config/db');

const debugMarks = async () => {
    try {
        console.log('Checking marks year distribution...');
        const res = await pool.query(`SELECT year, COUNT(*) FROM marks GROUP BY year ORDER BY year`);
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('Checking sample marks created_at vs year...');
        const sample = await pool.query(`SELECT id, created_at, year FROM marks LIMIT 5`);
        console.log(JSON.stringify(sample.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debugMarks();
