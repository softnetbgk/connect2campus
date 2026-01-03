const axios = require('axios');

const testApi = async () => {
    try {
        // Authenticate (Login as Admin) - skipping full auth flow, simulating directly if I can or using unit test style
        // Since I can't easily login via script without valid creds/token flow matching the exact environment...
        // I will rely on the unit test approach: CALLING THE CONTROLLER DIRECTLY if I mock req/res? 
        // No, that's complex.

        // I'll just use the DB query I wrote in the controller to verify IT works.
        const { pool } = require('../config/db');
        const school_id = (await pool.query('SELECT id FROM schools LIMIT 1')).rows[0].id; // assume 1

        console.log('Testing Query with logic from controller...');

        const params = [school_id, 11, 4, 1, 2024];
        let query = `SELECT m.* 
             FROM marks m
             WHERE m.school_id = $1 AND m.class_id = $2 AND m.section_id = $3 AND m.exam_type_id = $4
             AND m.year = $5`;

        const res = await pool.query(query, params);
        console.log(`Query found ${res.rowCount} rows.`);

        if (res.rowCount === 0) {
            console.log('Zero rows? Details:');
            // check without year
            const resNoYear = await pool.query(`SELECT count(*) FROM marks WHERE school_id=$1 AND class_id=$2 AND section_id=$3 AND exam_type_id=$4`, [school_id, 11, 4, 1]);
            console.log('Count without year:', resNoYear.rows[0].count);

            // check year values
            const resYears = await pool.query(`SELECT year, count(*) FROM marks WHERE school_id=$1 AND class_id=$2 AND section_id=$3 AND exam_type_id=$4 GROUP BY year`, [school_id, 11, 4, 1]);
            console.log('Years available:', resYears.rows);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testApi();
