const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('🔄 Adding deleted student info columns...');

        // Add columns to marks table to store deleted student info
        await pool.query(`
            ALTER TABLE marks 
            ADD COLUMN IF NOT EXISTS deleted_student_name VARCHAR(200),
            ADD COLUMN IF NOT EXISTS deleted_student_admission_no VARCHAR(50)
        `);

        console.log('✅ Columns added to marks table');

        // Add columns to student_certificates table to store deleted student info
        await pool.query(`
            ALTER TABLE student_certificates 
            ADD COLUMN IF NOT EXISTS deleted_student_name VARCHAR(200),
            ADD COLUMN IF NOT EXISTS deleted_student_admission_no VARCHAR(50)
        `);

        console.log('✅ Columns added to student_certificates table');
        console.log('✅ Migration complete');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
