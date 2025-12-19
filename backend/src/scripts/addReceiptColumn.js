const { pool } = require('../config/db');

async function addReceiptColumn() {
    try {
        await pool.query(`
            ALTER TABLE fee_payments 
            ADD COLUMN IF NOT EXISTS receipt_no VARCHAR(50) UNIQUE;
        `);
        console.log('✅ Receipt column added successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error adding receipt column:', error);
        process.exit(1);
    }
}

addReceiptColumn();
