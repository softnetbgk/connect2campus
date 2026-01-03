const { pool } = require('../config/db');

const addJanuaryExpenses = async () => {
    try {
        // Add expenses for January 2025 (last year, current month)
        await pool.query(`
            INSERT INTO expenditures (school_id, title, amount, category, expense_date, payment_method, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [1, 'January 2025 Expense', 4500, 'Supplies', '2025-01-15', 'Cash', 'Test expense for January 2025']);

        console.log('✅ Added expense for January 2025');

        // Add another expense for January 2025
        await pool.query(`
            INSERT INTO expenditures (school_id, title, amount, category, expense_date, payment_method, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [1, 'Maintenance Jan 2025', 6000, 'Maintenance', '2025-01-20', 'Bank Transfer', 'Maintenance work in January 2025']);

        console.log('✅ Added another expense for January 2025');

        console.log('\n✅ All January 2025 expenses added!');
        console.log('\nNow you can test:');
        console.log('  - Year: 2025, Month: January → Should show 2 expenses (₹4,500 + ₹6,000)');
        console.log('  - Year: 2026, Month: January → Should show 1 expense (₹7,500)');

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
};

addJanuaryExpenses();
