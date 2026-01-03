const { pool } = require('../config/db');

const check = async () => {
    try {
        console.log('Checking Schools...');
        await pool.query('SELECT id FROM schools LIMIT 1');

        console.log('Checking Students...');
        await pool.query('SELECT id FROM students LIMIT 1');

        console.log('Checking Subjects...');
        await pool.query('SELECT id FROM subjects LIMIT 1');

        console.log('Checking Exams...');
        await pool.query('SELECT id FROM exam_types LIMIT 1');

        console.log('All Checks Passed');
        process.exit(0);
    } catch (e) {
        console.error('Check Failed:', e); // Full error might be truncated but let's see
        process.exit(1);
    }
};
check();
