const { pool } = require('../config/db');

async function checkSchema() {
    try {
        console.log('--- Sections Table Schema ---');
        const sections = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sections';
        `);
        console.log(sections.rows);

        console.log('\n--- Subjects Table Schema ---');
        const subjects = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'subjects';
        `);
        console.log(subjects.rows);

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        pool.end();
    }
}

checkSchema();
