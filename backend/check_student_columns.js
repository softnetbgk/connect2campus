const { pool } = require('./src/config/db');

const checkColumns = async () => {
    try {
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'students' 
            ORDER BY ordinal_position
        `);

        console.log('Students table columns:');
        result.rows.forEach(row => console.log('  -', row.column_name));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
};

checkColumns();
