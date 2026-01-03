const { pool } = require('../config/db');

const checkRecentStudent = async () => {
    try {
        // Get the most recently added student
        const student = await pool.query(`
            SELECT id, name, class_id, section_id, created_at 
            FROM students 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (student.rows.length === 0) {
            console.log('No students found');
            process.exit(0);
        }

        const s = student.rows[0];
        console.log('\n📝 Most Recent Student:');
        console.log(`  ID: ${s.id}`);
        console.log(`  Name: ${s.name}`);
        console.log(`  Class: ${s.class_id}, Section: ${s.section_id}`);
        console.log(`  Added: ${s.created_at}`);

        // Check if this student has marks
        const marks = await pool.query(`
            SELECT year, COUNT(*) as count
            FROM marks 
            WHERE student_id = $1
            GROUP BY year
            ORDER BY year DESC
        `, [s.id]);

        console.log('\n📊 Marks for this student:');
        if (marks.rows.length === 0) {
            console.log('  ✅ No marks (as expected for new student)');
        } else {
            console.log('  ❌ HAS MARKS (should be empty!):');
            marks.rows.forEach(m => {
                console.log(`    Year ${m.year}: ${m.count} marks`);
            });
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkRecentStudent();
