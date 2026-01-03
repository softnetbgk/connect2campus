const { pool } = require('../config/db');

const checkSeeded = async () => {
    try {
        const res = await pool.query(`
            SELECT class_id, section_id, count(*) 
            FROM marks 
            WHERE year = 2024 
            GROUP BY class_id, section_id
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
checkSeeded();
