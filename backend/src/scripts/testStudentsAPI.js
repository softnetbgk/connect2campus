const { pool } = require('../config/db');

const testStudentsAPI = async () => {
    try {
        // Test the exact query the API uses
        const school_id = 1;
        const class_id = 11;
        const section_id = 4;

        console.log('\n🔍 Testing Students API Query:');
        console.log(`School: ${school_id}, Class: ${class_id}, Section: ${section_id}\n`);

        const query = `
            SELECT * FROM students 
            WHERE school_id = $1 
            AND class_id = $2 
            AND section_id = $3
            ORDER BY roll_number
        `;

        const result = await pool.query(query, [school_id, class_id, section_id]);

        console.log(`✅ Found ${result.rows.length} students\n`);

        if (result.rows.length > 0) {
            console.log('Students:');
            result.rows.forEach(s => {
                console.log(`  - ID: ${s.id}, Name: ${s.name}, Roll: ${s.roll_number}`);
            });
        } else {
            console.log('❌ No students found!');
            console.log('\nChecking what students exist...');

            const all = await pool.query('SELECT id, name, class_id, section_id FROM students WHERE school_id = $1 LIMIT 10', [school_id]);
            console.log('\nFirst 10 students in school:');
            console.log(JSON.stringify(all.rows, null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
};

testStudentsAPI();
