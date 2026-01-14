const { pool } = require('../config/db');

/**
 * Migration: Academic Data Preservation
 * 
 * Purpose:
 * 1. Change marks foreign key from CASCADE to RESTRICT to prevent data loss
 * 2. Add academic_year and deleted_at columns to exam_schedules
 * 3. Update existing records with current academic year
 */

async function migrateAcademicDataPreservation() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Academic Data Preservation Migration...\n');

        await client.query('BEGIN');

        // Step 1: Drop existing CASCADE constraint on marks.exam_type_id
        console.log('Step 1: Updating marks table foreign key constraint...');
        try {
            // First, check if the constraint exists
            const constraintCheck = await client.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'marks' 
                  AND constraint_type = 'FOREIGN KEY'
                  AND constraint_name LIKE '%exam_type%'
            `);

            if (constraintCheck.rows.length > 0) {
                const constraintName = constraintCheck.rows[0].constraint_name;
                console.log(`   Found constraint: ${constraintName}`);

                // Drop the old CASCADE constraint
                await client.query(`
                    ALTER TABLE marks 
                    DROP CONSTRAINT IF EXISTS ${constraintName}
                `);
                console.log('   ✅ Dropped old CASCADE constraint');
            }

            // Add new RESTRICT constraint
            await client.query(`
                ALTER TABLE marks 
                ADD CONSTRAINT fk_marks_exam_type 
                FOREIGN KEY (exam_type_id) 
                REFERENCES exam_types(id) 
                ON DELETE RESTRICT
            `);
            console.log('   ✅ Added new RESTRICT constraint\n');
        } catch (err) {
            console.log('   ⚠️  Constraint already updated or error:', err.message);
        }

        // Step 2: Add academic_year column to exam_schedules
        console.log('Step 2: Adding academic_year column to exam_schedules...');
        await client.query(`
            ALTER TABLE exam_schedules 
            ADD COLUMN IF NOT EXISTS academic_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
        `);
        console.log('   ✅ Added academic_year column\n');

        // Step 3: Add deleted_at column for soft delete
        console.log('Step 3: Adding deleted_at column to exam_schedules...');
        await client.query(`
            ALTER TABLE exam_schedules 
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL
        `);
        console.log('   ✅ Added deleted_at column\n');

        // Step 4: Update existing exam_schedules with current year
        console.log('Step 4: Updating existing exam_schedules with academic year...');
        const currentYear = new Date().getFullYear();
        const updateResult = await client.query(`
            UPDATE exam_schedules 
            SET academic_year = $1 
            WHERE academic_year IS NULL
        `, [currentYear]);
        console.log(`   ✅ Updated ${updateResult.rowCount} records with year ${currentYear}\n`);

        // Step 5: Add index for better query performance
        console.log('Step 5: Adding indexes for academic year queries...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_exam_schedules_academic_year 
            ON exam_schedules(school_id, academic_year, deleted_at)
        `);
        console.log('   ✅ Added index on exam_schedules\n');

        // Step 6: Verify marks table already has year column
        console.log('Step 6: Verifying marks table year column...');
        const marksYearCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'marks' AND column_name = 'year'
        `);

        if (marksYearCheck.rows.length > 0) {
            console.log('   ✅ Marks table already has year column\n');
        } else {
            console.log('   ⚠️  Adding year column to marks table...');
            await client.query(`
                ALTER TABLE marks 
                ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
            `);
            console.log('   ✅ Added year column to marks\n');
        }

        await client.query('COMMIT');

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ Migration completed successfully!');
        console.log('═══════════════════════════════════════════════════');
        console.log('\nChanges made:');
        console.log('1. ✅ Marks foreign key changed from CASCADE to RESTRICT');
        console.log('2. ✅ Added academic_year column to exam_schedules');
        console.log('3. ✅ Added deleted_at column for soft delete');
        console.log('4. ✅ Updated existing records with current year');
        console.log('5. ✅ Added performance indexes');
        console.log('\nNext steps:');
        console.log('- Update exam schedule deletion to use soft delete');
        console.log('- Add academic year filtering to queries');
        console.log('- Add UI for academic year selection');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        console.error('Error details:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    migrateAcademicDataPreservation()
        .then(() => {
            console.log('Migration script completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration script failed:', err);
            process.exit(1);
        });
}

module.exports = migrateAcademicDataPreservation;
