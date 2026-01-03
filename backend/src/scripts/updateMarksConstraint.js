const { pool } = require('../config/db');

const updateConstraint = async () => {
    try {
        console.log('Updating unique constraint on marks table...');

        // 1. Find Constraint Name
        const res = await pool.query(`
            SELECT conname
            FROM pg_constraint c
            WHERE conrelid = 'marks'::regclass AND contype = 'u'
        `);

        if (res.rows.length > 0) {
            const constraintName = res.rows[0].conname;
            console.log(`Found constraint: ${constraintName}. Dropping...`);
            await pool.query(`ALTER TABLE marks DROP CONSTRAINT "${constraintName}"`);
        }

        // 2. Add New Constraint
        console.log('Adding new constraint inclusive of year...');
        await pool.query(`
            ALTER TABLE marks 
            ADD CONSTRAINT marks_unique_year 
            UNIQUE (school_id, student_id, subject_id, exam_type_id, year)
        `);

        console.log('Constraint updated successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
};

updateConstraint();
