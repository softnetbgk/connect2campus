const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testSchoolDelete() {
    const client = await pool.connect();
    try {
        const schoolId = 5; // The school you're trying to delete

        console.log('Testing deletion of school ID:', schoolId);

        // Try direct delete to see what constraint fails
        try {
            await client.query('DELETE FROM schools WHERE id = $1', [schoolId]);
            console.log('✅ Direct delete succeeded!');
        } catch (error) {
            console.log('❌ Direct delete failed:');
            console.log('Error:', error.message);
            console.log('Detail:', error.detail);
            console.log('Table:', error.table);
            console.log('Constraint:', error.constraint);
        }

    } finally {
        client.release();
        pool.end();
    }
}

testSchoolDelete();
