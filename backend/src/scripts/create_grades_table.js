const { pool } = require('../config/db');

const createGradesTable = async () => {
    try {
        console.log('🔄 Creating grades table...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS grades (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                name VARCHAR(10) NOT NULL,
                min_percentage NUMERIC(5, 2) NOT NULL,
                max_percentage NUMERIC(5, 2) NOT NULL,
                grade_point NUMERIC(4, 2),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_grade_name_per_school UNIQUE (school_id, name)
            );
        `);

        console.log('✅ Grades table created successfully');
    } catch (error) {
        console.error('❌ Error creating grades table:', error);
    } finally {
        pool.end();
    }
};

if (require.main === module) {
    createGradesTable();
}

module.exports = { createGradesTable };
