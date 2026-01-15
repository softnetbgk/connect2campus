const { pool } = require('../config/db');

async function migrateSubjects() {
    try {
        console.log('--- Migrating Subjects Table ---');

        await pool.query(`
            ALTER TABLE subjects 
            ADD COLUMN IF NOT EXISTS code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Theory';
        `);

        console.log('✅ Added code and type columns to subjects table.');

    } catch (error) {
        console.error('❌ Error migrating subjects:', error);
    } finally {
        pool.end();
    }
}

migrateSubjects();
