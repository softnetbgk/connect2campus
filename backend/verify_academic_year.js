const { pool } = require('./src/config/db');

async function verifyAcademicYearColumns() {
    try {
        console.log('🔍 Checking which tables have academic_year_id column...\n');

        const result = await pool.query(`
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE column_name = 'academic_year_id'
            AND table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('✅ Tables with academic_year_id:');
        result.rows.forEach(row => {
            console.log(`   ✓ ${row.table_name}`);
        });

        console.log(`\n📊 Total: ${result.rows.length} tables\n`);

        // Check current academic year
        const currentYear = await pool.query(`
            SELECT * FROM academic_years 
            WHERE status = 'active' 
            LIMIT 1
        `);

        if (currentYear.rows.length > 0) {
            const year = currentYear.rows[0];
            console.log('📅 Current Active Academic Year:');
            console.log(`   Year: ${year.year_label}`);
            console.log(`   Start: ${year.start_date.toISOString().split('T')[0]}`);
            console.log(`   End: ${year.end_date.toISOString().split('T')[0]}`);
            console.log(`   Status: ${year.status}`);
        } else {
            console.log('⚠️  No active academic year found');
        }

        await pool.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyAcademicYearColumns();
