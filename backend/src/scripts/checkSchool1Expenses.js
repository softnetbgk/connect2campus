const { pool } = require('../config/db');

const checkSchool1Expenses = async () => {
    try {
        const expenses = await pool.query(`
            SELECT id, title, amount, expense_date, school_id 
            FROM expenditures 
            WHERE school_id = 1 
            ORDER BY expense_date DESC
        `);

        console.log(`\nExpenses for school_id 1: ${expenses.rows.length} found\n`);

        expenses.rows.forEach(e => {
            const date = new Date(e.expense_date);
            console.log(`${date.toISOString().split('T')[0]} (${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}): ${e.title} - ₹${e.amount}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkSchool1Expenses();
