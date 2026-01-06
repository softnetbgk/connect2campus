const { pool } = require('../config/db');

const addComponentsToSchedule = async () => {
    try {
        console.log('🔄 Altering exam_schedules table...');

        await pool.query(`
            ALTER TABLE exam_schedules
            ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]'::jsonb;
        `);

        console.log('✅ Added components column to exam_schedules');
    } catch (error) {
        console.error('❌ Error altering table:', error);
    } finally {
        pool.end();
    }
};

if (require.main === module) {
    addComponentsToSchedule();
}

module.exports = { addComponentsToSchedule };
