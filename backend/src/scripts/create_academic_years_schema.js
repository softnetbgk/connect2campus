const { pool } = require('../config/db');

/**
 * Create Academic Years Management Schema
 * 
 * This creates the infrastructure for managing academic years,
 * allowing schools to track data by year and transition smoothly
 * between academic sessions.
 */

async function createAcademicYearsSchema() {
    const client = await pool.connect();
    try {
        console.log('🎓 Creating Academic Years Management Schema...\n');

        await client.query('BEGIN');

        // Step 1: Create academic_years table
        console.log('Step 1: Creating academic_years table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS academic_years (
                id SERIAL PRIMARY KEY,
                school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                year_label VARCHAR(20) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_school_year UNIQUE(school_id, year_label),
                CONSTRAINT valid_date_range CHECK (end_date > start_date)
            )
        `);
        console.log('   ✅ academic_years table created\n');

        // Step 2: Add academic_year_id to attendance table
        console.log('Step 2: Adding academic_year_id to attendance...');
        await client.query(`
            ALTER TABLE attendance 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log('   ✅ Added to attendance\n');

        // Step 3: Add academic_year_id to marks table
        console.log('Step 3: Adding academic_year_id to marks...');
        await client.query(`
            ALTER TABLE marks 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log('   ✅ Added to marks\n');

        // Step 4: Add academic_year_id to fee_payments table
        console.log('Step 4: Adding academic_year_id to fee_payments...');
        await client.query(`
            ALTER TABLE fee_payments 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log('   ✅ Added to fee_payments\n');

        // Step 5: Add academic_year_id to salary_payments table
        console.log('Step 5: Adding academic_year_id to salary_payments...');
        await client.query(`
            ALTER TABLE salary_payments 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log('   ✅ Added to salary_payments\n');

        // Step 6: Add academic_year_id to expenditures table
        console.log('Step 6: Adding academic_year_id to expenditures...');
        await client.query(`
            ALTER TABLE expenditures 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log('   ✅ Added to expenditures\n');

        // Step 7: Update exam_schedules (already has academic_year column, add FK)
        console.log('Step 7: Updating exam_schedules...');
        await client.query(`
            ALTER TABLE exam_schedules 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log('   ✅ Added to exam_schedules\n');

        // Step 8: Create indexes for performance
        console.log('Step 8: Creating performance indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_academic_years_school_status 
            ON academic_years(school_id, status)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_attendance_academic_year 
            ON attendance(academic_year_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_marks_academic_year 
            ON marks(academic_year_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_fee_payments_academic_year 
            ON fee_payments(academic_year_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_salary_payments_academic_year 
            ON salary_payments(academic_year_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_expenditures_academic_year 
            ON expenditures(academic_year_id)
        `);
        console.log('   ✅ Indexes created\n');

        // Step 9: Create default academic year for existing schools
        console.log('Step 9: Creating default academic years for existing schools...');

        // Get current date to determine academic year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        // Determine academic year based on common April-March cycle
        let startYear, endYear;
        if (currentMonth >= 4) {
            // April onwards - current academic year
            startYear = currentYear;
            endYear = currentYear + 1;
        } else {
            // Jan-March - previous academic year
            startYear = currentYear - 1;
            endYear = currentYear;
        }

        const yearLabel = `${startYear}-${endYear}`;
        const startDate = `${startYear}-04-01`;
        const endDate = `${endYear}-03-31`;

        const result = await client.query(`
            INSERT INTO academic_years (school_id, year_label, start_date, end_date, status)
            SELECT 
                id,
                $1,
                $2,
                $3,
                'active'
            FROM schools
            WHERE NOT EXISTS (
                SELECT 1 FROM academic_years WHERE school_id = schools.id
            )
            RETURNING *
        `, [yearLabel, startDate, endDate]);

        console.log(`   ✅ Created ${result.rowCount} default academic years (${yearLabel})\n`);

        // Step 10: Link existing data to academic years
        console.log('Step 10: Linking existing data to academic years...');

        // Update marks
        await client.query(`
            UPDATE marks m
            SET academic_year_id = (
                SELECT ay.id 
                FROM academic_years ay 
                WHERE ay.school_id = m.school_id 
                AND ay.status = 'active'
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        // Update attendance
        await client.query(`
            UPDATE attendance a
            SET academic_year_id = (
                SELECT ay.id 
                FROM academic_years ay 
                WHERE ay.school_id = a.school_id 
                AND ay.status = 'active'
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        // Update fee_payments
        await client.query(`
            UPDATE fee_payments fp
            SET academic_year_id = (
                SELECT ay.id 
                FROM academic_years ay 
                WHERE ay.school_id = fp.school_id 
                AND ay.status = 'active'
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        // Update salary_payments
        await client.query(`
            UPDATE salary_payments sp
            SET academic_year_id = (
                SELECT ay.id 
                FROM academic_years ay 
                WHERE ay.school_id = sp.school_id 
                AND ay.status = 'active'
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        // Update expenditures
        await client.query(`
            UPDATE expenditures e
            SET academic_year_id = (
                SELECT ay.id 
                FROM academic_years ay 
                WHERE ay.school_id = e.school_id 
                AND ay.status = 'active'
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        // Update exam_schedules
        await client.query(`
            UPDATE exam_schedules es
            SET academic_year_id = (
                SELECT ay.id 
                FROM academic_years ay 
                WHERE ay.school_id = es.school_id 
                AND ay.status = 'active'
                LIMIT 1
            )
            WHERE academic_year_id IS NULL
        `);

        console.log('   ✅ Linked existing data to academic years\n');

        await client.query('COMMIT');

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ Academic Years Schema Created Successfully!');
        console.log('═══════════════════════════════════════════════════');
        console.log('\nWhat was created:');
        console.log('1. ✅ academic_years table');
        console.log('2. ✅ academic_year_id columns in 6 tables');
        console.log('3. ✅ Performance indexes');
        console.log(`4. ✅ Default academic year: ${yearLabel}`);
        console.log('5. ✅ Existing data linked to current year');
        console.log('\nNext steps:');
        console.log('- Create academic year management API');
        console.log('- Add academic year settings UI');
        console.log('- Add dashboard year display widget');
        console.log('- Add year selector for historical data');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Schema creation failed:', error);
        console.error('Error details:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    createAcademicYearsSchema()
        .then(() => {
            console.log('Schema creation completed');
            process.exit(0);
        })
        .catch(err => {
            console.error('Schema creation failed:', err);
            process.exit(1);
        });
}

module.exports = createAcademicYearsSchema;
