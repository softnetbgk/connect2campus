const { pool } = require('./src/config/db');

const initTables = async () => {
    try {
        console.log('🔄 Creating Missing Core Tables...');

        // 1. Teachers (from createTeacherStaffSchema)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(20),
                employee_id VARCHAR(50),
                subject_specialization VARCHAR(255),
                gender VARCHAR(10),
                join_date DATE DEFAULT CURRENT_DATE,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(school_id, employee_id)
            );
        `);
        console.log('✅ Teachers table ready');

        // 2. Classes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS classes (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                grade_level INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(school_id, name)
            );
        `);
        console.log('✅ Classes table ready');

        // 3. Sections
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sections (
                id SERIAL PRIMARY KEY,
                class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
                name VARCHAR(10) NOT NULL,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(class_id, name)
            );
        `);
        console.log('✅ Sections table ready');

        // 4. Students
        await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                admission_no VARCHAR(50) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
                email VARCHAR(255),
                class_id INTEGER REFERENCES classes(id),
                section_id INTEGER REFERENCES sections(id),
                roll_number INTEGER,
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                parent_phone VARCHAR(20),
                dob DATE,
                gender VARCHAR(10),
                address TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(school_id, admission_no)
            );
        `);
        console.log('✅ Students table ready');

        // 5. Staff
        await pool.query(`
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
                school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                email VARCHAR(255),
                phone VARCHAR(20),
                employee_id VARCHAR(50),
                role VARCHAR(100),
                gender VARCHAR(10),
                join_date DATE DEFAULT CURRENT_DATE,
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(school_id, employee_id)
            );
        `);
        console.log('✅ Staff table ready');

    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    } finally {
        pool.end();
    }
};

initTables();
