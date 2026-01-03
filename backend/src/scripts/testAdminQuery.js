const { pool } = require('../config/db');

const testAdminQuery = async () => {
    try {
        // Simulate what school admin would query
        const school_id = 1; // Assuming school ID 1
        const class_id = 11; // From our data
        const section_id = 4; // From our data
        const exam_type_id = 1; // Assuming exam type 1
        const year = 2025; // Testing 2025

        console.log('\n🔍 Testing School Admin Query:');
        console.log(`School: ${school_id}, Class: ${class_id}, Section: ${section_id}, Exam: ${exam_type_id}, Year: ${year}`);

        const query = `SELECT m.*, 
                    st.name as student_name,
                    st.admission_no as admission_number,
                    st.roll_number,
                    sub.name as subject_name,
                    et.name as exam_name,
                    et.max_marks
             FROM marks m
             JOIN students st ON m.student_id = st.id
             LEFT JOIN subjects sub ON m.subject_id = sub.id
             JOIN exam_types et ON m.exam_type_id = et.id
             WHERE m.school_id = $1 AND m.class_id = $2 AND m.section_id = $3 AND m.exam_type_id = $4 AND m.year = $5
             ORDER BY st.roll_number, sub.name`;

        const result = await pool.query(query, [school_id, class_id, section_id, exam_type_id, year]);

        console.log(`\n✅ Found ${result.rows.length} marks`);

        if (result.rows.length > 0) {
            console.log('\nSample records:');
            console.log(JSON.stringify(result.rows.slice(0, 3), null, 2));
        } else {
            console.log('\n❌ No marks found. Checking what data exists...');

            // Check what class/section/exam combinations exist for 2025
            const available = await pool.query(`
                SELECT DISTINCT m.class_id, m.section_id, m.exam_type_id, COUNT(*) as count
                FROM marks m
                WHERE m.school_id = $1 AND m.year = $2
                GROUP BY m.class_id, m.section_id, m.exam_type_id
                ORDER BY count DESC
            `, [school_id, year]);

            console.log('\nAvailable combinations for 2025:');
            console.log(JSON.stringify(available.rows, null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testAdminQuery();
