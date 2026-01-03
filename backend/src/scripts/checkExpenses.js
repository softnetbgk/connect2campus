const { pool } = require('../config/db');

const checkExpenses = async () => {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM expenditures');
        console.log('Total expenses:', total.rows[0].count);

        const byYear = await pool.query(`
            SELECT EXTRACT(YEAR FROM expense_date) as year, COUNT(*) as count
            FROM expenditures
            GROUP BY EXTRACT(YEAR FROM expense_date)
            ORDER BY year DESC
        `);

        console.log('\nBy Year:');
        console.log(JSON.stringify(byYear.rows, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkExpenses();
