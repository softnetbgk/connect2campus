const { pool } = require('../config/db');

const checkYearDistribution = async () => {
    try {
        const res = await pool.query(`
            SELECT year, COUNT(*) as count 
            FROM marks 
            GROUP BY year 
            ORDER BY year DESC
        `);

        console.log('\n📊 Marks Distribution by Year:');
        console.log(JSON.stringify(res.rows, null, 2));

        const total = await pool.query('SELECT COUNT(*) FROM marks');
        console.log(`\nTotal: ${total.rows[0].count} marks`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkYearDistribution();
