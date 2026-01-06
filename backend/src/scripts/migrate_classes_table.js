const { pool } = require('../config/db');

async function migrate() {
    try {
        console.log('Adding class_teacher_id to classes table...');
        await pool.query(`
            ALTER TABLE classes 
            ADD COLUMN IF NOT EXISTS class_teacher_id INTEGER REFERENCES teachers(id);
        `);
        console.log('Migration successful.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
