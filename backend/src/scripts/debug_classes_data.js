const { pool } = require('../config/db');

async function checkData() {
    try {
        console.log('--- Schools ---');
        const schools = await pool.query('SELECT id, name, school_code FROM schools');
        console.table(schools.rows);

        console.log('\n--- Classes ---');
        const classes = await pool.query('SELECT id, school_id, name FROM classes ORDER BY school_id, name');
        console.table(classes.rows);

        console.log('\n--- Sections ---');
        const sections = await pool.query(`
            SELECT s.id, s.class_id, c.name as class_name, s.name as section_name 
            FROM sections s 
            JOIN classes c ON s.class_id = c.id 
            ORDER BY c.name, s.name
        `);
        console.table(sections.rows);

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        pool.end();
    }
}

checkData();
