const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('Running migration...');

        // Add status column to students if it doesn't exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='status') THEN 
                    ALTER TABLE students ADD COLUMN status VARCHAR(50) DEFAULT 'Active'; 
                END IF; 
            END $$;
        `);

        // Ensure all existing students have status 'Active' if null
        await pool.query("UPDATE students SET status = 'Active' WHERE status IS NULL");

        console.log('Migration successful: Added status to students table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        pool.end();
    }
};

migrate();
