const { pool } = require('../config/db');

const addComponentScoresToMarks = async () => {
    try {
        console.log('🔄 Altering marks table...');

        await pool.query(`
            ALTER TABLE marks
            ADD COLUMN IF NOT EXISTS component_scores JSONB DEFAULT '{}'::jsonb;
        `);

        console.log('✅ Added component_scores column to marks');
    } catch (error) {
        console.error('❌ Error altering table:', error);
    } finally {
        pool.end();
    }
};

if (require.main === module) {
    addComponentScoresToMarks();
}

module.exports = { addComponentScoresToMarks };
