const { pool } = require('../config/db');

const checkExpenseDetails = async () => {
    try {
        const expense = await pool.query('SELECT * FROM expenditures LIMIT 1');

        if (expense.rows.length === 0) {
            console.log('No expenses found');
            process.exit(0);
        }

        const e = expense.rows[0];
        console.log('\n📝 Expense Details:');
        console.log('ID:', e.id);
        console.log('Title:', e.title);
        console.log('Amount:', e.amount);
        console.log('Expense Date:', e.expense_date);
        console.log('Year from date:', new Date(e.expense_date).getFullYear());
        console.log('School ID:', e.school_id);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkExpenseDetails();
