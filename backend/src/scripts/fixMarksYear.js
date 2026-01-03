const { pool } = require('../config/db');

const fixMarksYears = async () => {
    try {
        console.log('Fixing year column in marks table...');

        // Update year from created_at
        const res = await pool.query(`
            UPDATE marks 
            SET year = EXTRACT(YEAR FROM created_at)
            WHERE year IS NULL OR year = EXTRACT(YEAR FROM CURRENT_DATE)
        `);

        console.log(`Updated ${res.rowCount} rows.`);

        // Verify
        const verify = await pool.query(`SELECT year, COUNT(*) FROM marks GROUP BY year`);
        console.table(verify.rows);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixMarksYears();
