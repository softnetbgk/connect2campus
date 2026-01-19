const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('🔄 Adding academic_year_id to student_certificates...');

        // Add column
        await pool.query(`
            ALTER TABLE student_certificates 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER 
            REFERENCES academic_years(id) ON DELETE SET NULL
        `);

        console.log('✅ Column added');

        // Set to current academic year for existing records
        const updateResult = await pool.query(`
            UPDATE student_certificates 
            SET academic_year_id = (
                SELECT id FROM academic_years 
                WHERE school_id = student_certificates.school_id 
                AND status = 'active' 
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        console.log(`✅ Updated ${updateResult.rowCount} existing certificate records`);

        // Create index for performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_student_certificates_academic_year 
            ON student_certificates(academic_year_id)
        `);

        console.log('✅ Index created');
        console.log('✅ Migration complete');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
