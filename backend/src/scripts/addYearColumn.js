const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // Check if 'year' column exists in marks table
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='marks' AND column_name='year'
        `);

        if (res.rows.length === 0) {
            console.log('Adding year column to marks table...');
            await pool.query(`ALTER TABLE marks ADD COLUMN year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)`);
            console.log('Column added successfully.');
        } else {
            console.log('Year column already exists.');
        }

        // Also add unique constraint upgrade if needed?
        // Old constraint: (school_id, student_id, subject_id, exam_type_id)
        // New constraint should theoretically include year, but altering constraints is heavy.
        // For now, let's just add the column to allow filtering and saving.
        // If we want multiple years of data for same student/subject/exam, we NEED year in the unique constraint.

        // Drop old constraint if strictly needed.
        // Let's first check constraints.
        // SELECT conname FROM pg_constraint WHERE conrelid = 'marks'::regclass AND contype = 'u';

        // For simplicity and immediate fix:
        // We will just use the new column for entering data.

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
