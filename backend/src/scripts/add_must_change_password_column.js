const { pool } = require('../config/db');

async function addMustChangePasswordColumn() {
    try {
        console.log('Adding must_change_password column to users table...');

        // Add column if it doesn't exist
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE
        `);

        console.log('✅ Column added successfully!');
        console.log('Note: Existing users will have must_change_password = FALSE');
        console.log('New users created from now on will have must_change_password = TRUE');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addMustChangePasswordColumn();
