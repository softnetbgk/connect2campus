const { pool } = require('../config/db');

const checkConstraints = async () => {
    try {
        const res = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid) as definition
            FROM pg_constraint c
            WHERE conrelid = 'marks'::regclass AND contype = 'u'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkConstraints();
