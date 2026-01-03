const { pool } = require('../config/db');

const addTestExpense = async () => {
    try {
        // Add expense for school_id 1 (2025)
        await pool.query(`
            INSERT INTO expenditures (school_id, title, amount, category, expense_date, payment_method, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [1, 'Test Expense 2025', 5000, 'Maintenance', '2025-06-15', 'Cash', 'Test expense for year 2025']);

        console.log('✅ Added test expense for 2025 (school_id 1)');

        // Add expense for school_id 1 (2024)
        await pool.query(`
            INSERT INTO expenditures (school_id, title, amount, category, expense_date, payment_method, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [1, 'Test Expense 2024', 3000, 'Supplies', '2024-08-20', 'Bank Transfer', 'Test expense for year 2024']);

        console.log('✅ Added test expense for 2024 (school_id 1)');

        // Add expense for school_id 1 (2026 - current year)
        await pool.query(`
            INSERT INTO expenditures (school_id, title, amount, category, expense_date, payment_method, description, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        `, [1, 'Test Expense 2026', 7500, 'Utilities', '2026-01-02', 'UPI', 'Test expense for current year 2026']);

        console.log('✅ Added test expense for 2026 (school_id 1)');

        console.log('\n✅ All test expenses added successfully!');
        console.log('Now refresh Expenditure Management and you can view:');
        console.log('  - Year 2026: 1 expense (₹7,500)');
        console.log('  - Year 2025: 1 expense (₹5,000)');
        console.log('  - Year 2024: 1 expense (₹3,000)');

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
};

addTestExpense();
