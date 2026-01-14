const { pool } = require('../config/db');

async function verifyMigration() {
    const client = await pool.connect();
    try {
        console.log('🔍 Verifying Academic Data Preservation Migration...\n');

        // Check 1: Verify exam_schedules has academic_year column
        const academicYearCheck = await client.query(`
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'exam_schedules' 
            AND column_name IN ('academic_year', 'deleted_at')
            ORDER BY column_name
        `);

        console.log('1. Exam Schedules Columns:');
        if (academicYearCheck.rows.length > 0) {
            academicYearCheck.rows.forEach(col => {
                console.log(`   ✅ ${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('   ❌ Missing columns!');
        }

        // Check 2: Verify marks foreign key constraint
        const constraintCheck = await client.query(`
            SELECT 
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.referential_constraints AS rc
                ON rc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'marks' 
            AND kcu.column_name = 'exam_type_id'
        `);

        console.log('\n2. Marks Foreign Key Constraint:');
        if (constraintCheck.rows.length > 0) {
            const constraint = constraintCheck.rows[0];
            console.log(`   Constraint: ${constraint.constraint_name}`);
            console.log(`   Delete Rule: ${constraint.delete_rule}`);
            if (constraint.delete_rule === 'RESTRICT' || constraint.delete_rule === 'NO ACTION') {
                console.log('   ✅ Marks are protected from cascade deletion');
            } else {
                console.log('   ⚠️  Delete rule is still CASCADE');
            }
        } else {
            console.log('   ❌ No constraint found!');
        }

        // Check 3: Count exam schedules with academic year
        const scheduleCount = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(academic_year) as with_year,
                COUNT(deleted_at) as deleted
            FROM exam_schedules
        `);

        console.log('\n3. Exam Schedules Data:');
        if (scheduleCount.rows.length > 0) {
            const stats = scheduleCount.rows[0];
            console.log(`   Total schedules: ${stats.total}`);
            console.log(`   With academic year: ${stats.with_year}`);
            console.log(`   Deleted: ${stats.deleted}`);
        }

        // Check 4: Verify marks has year column
        const marksYearCheck = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marks' AND column_name = 'year'
        `);

        console.log('\n4. Marks Table Year Column:');
        if (marksYearCheck.rows.length > 0) {
            console.log(`   ✅ Year column exists (${marksYearCheck.rows[0].data_type})`);
        } else {
            console.log('   ❌ Year column missing!');
        }

        // Check 5: Verify indexes
        const indexCheck = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'exam_schedules'
            AND indexname LIKE '%academic_year%'
        `);

        console.log('\n5. Performance Indexes:');
        if (indexCheck.rows.length > 0) {
            indexCheck.rows.forEach(idx => {
                console.log(`   ✅ ${idx.indexname}`);
            });
        } else {
            console.log('   ⚠️  No academic year index found');
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ Verification Complete!');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

verifyMigration()
    .then(() => {
        console.log('Verification completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Verification failed:', err);
        process.exit(1);
    });
