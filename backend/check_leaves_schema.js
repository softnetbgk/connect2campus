const { pool } = require('./src/config/db');

async function checkLeavesSchema() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'leaves' 
            ORDER BY ordinal_position
        `);

        console.log('Leaves table schema:');
        console.log(JSON.stringify(result.rows, null, 2));

        // Also check if there are any records
        const count = await pool.query('SELECT COUNT(*) FROM leaves');
        console.log('\nTotal leaves records:', count.rows[0].count);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkLeavesSchema();
