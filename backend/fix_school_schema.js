const { pool } = require('./src/config/db');

const fixSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing Schools Table Schema...');

        await client.query('BEGIN');

        // Add status column if missing (for soft delete)
        await client.query(`
            ALTER TABLE schools 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
        `);
        console.log('✅ Added "status" column.');

        // Add is_active column just in case (for enable/disable)
        await client.query(`
            ALTER TABLE schools 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        `);
        console.log('✅ Added "is_active" column.');

        await client.query('COMMIT');
        console.log('🎉 Schema Fixed Successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error fixing schema:', error);
    } finally {
        client.release();
        pool.end(); // Close connection
    }
};

fixSchema();
