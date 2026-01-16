const { pool } = require('./src/config/db');
const bcrypt = require('bcrypt');

async function initFreshDb() {
    console.log('🌱 Initializing Fresh Test Database...');
    const client = await pool.connect();

    try {
        const passwordHash = await bcrypt.hash('123456', 10);

        // 0. Fix Schema (Missing Columns)
        await client.query(`
            ALTER TABLE schools
            ADD COLUMN IF NOT EXISTS school_code VARCHAR(50) UNIQUE,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

            ALTER TABLE teachers 
            ADD COLUMN IF NOT EXISTS user_id INTEGER,
            ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
            ADD COLUMN IF NOT EXISTS subject_specialization VARCHAR(255);

            ALTER TABLE staff 
            ADD COLUMN IF NOT EXISTS user_id INTEGER,
            ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
        `);
        console.log('✅ Schema Updated: schools table fixed');

        // 1. Create Super Admin
        const superEmail = 'superadmin@system.com'; // Matching the generic placeholder idea or just a standard one
        await client.query(`
            INSERT INTO users(email, password, role) VALUES($1, $2, 'SUPER_ADMIN')
            ON CONFLICT(email) DO UPDATE SET password = $2
            `, [superEmail, passwordHash]);
        console.log(`✅ Super Admin: ${superEmail} | 123456`);

        // 2. Create Default School
        const schoolRes = await client.query(`
            INSERT INTO schools(name, address, contact_email, school_code, is_active)
        VALUES('Demo Public School', '123 Education Lane', 'admin@school.com', 'DEMO01', true)
            ON CONFLICT DO NOTHING
            RETURNING id
        `);

        let schoolId;
        if (schoolRes.rows.length > 0) {
            schoolId = schoolRes.rows[0].id;
        } else {
            const fetch = await client.query("SELECT id FROM schools WHERE school_code = 'DEMO01'");
            schoolId = fetch.rows[0].id;
        }
        console.log(`✅ School Created: Demo Public School(ID: ${schoolId})`);

        // 3. Create School Admin
        const adminEmail = 'admin@school.com';
        await client.query(`
            INSERT INTO users(email, password, role, school_id) VALUES($1, $2, 'SCHOOL_ADMIN', $3)
            ON CONFLICT(email) DO UPDATE SET password = $2, school_id = $3
            `, [adminEmail, passwordHash, schoolId]);
        console.log(`✅ School Admin: ${adminEmail} | 123456`);

        // 4. Create Teacher
        const teacherEmail = 'teacher@school.com';
        await client.query(`
            INSERT INTO users(email, password, role, school_id) VALUES($1, $2, 'TEACHER', $3)
            ON CONFLICT(email) DO UPDATE SET password = $2, school_id = $3
            `, [teacherEmail, passwordHash, schoolId]);

        // Ensure teacher profile exists
        await client.query(`
            INSERT INTO teachers(user_id, school_id, name, email, employee_id)
        VALUES((SELECT id FROM users WHERE email = $1), $2, 'Demo Teacher', $1, 'T001')
            ON CONFLICT(school_id, employee_id) DO NOTHING
        `, [teacherEmail, schoolId]);

        console.log(`✅ Teacher: ${teacherEmail} | 123456`);

    } catch (e) {
        console.error('Initialization Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

initFreshDb();
