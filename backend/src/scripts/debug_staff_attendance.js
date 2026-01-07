const { pool } = require('../config/db');

const debug = async () => {
    try {
        console.log('--- USERS (Role=STAFF) ---');
        const users = await pool.query("SELECT id, email, school_id FROM users WHERE role = 'STAFF' LIMIT 5");
        console.log(JSON.stringify(users.rows, null, 2));

        console.log('\n--- STAFF TABLE ---');
        const staff = await pool.query("SELECT id, name, email, school_id FROM staff LIMIT 5");
        console.log(JSON.stringify(staff.rows, null, 2));

        console.log('\n--- STAFF ATTENDANCE ---');
        const att = await pool.query("SELECT id, staff_id, date, status, school_id FROM staff_attendance ORDER BY date DESC LIMIT 5");
        console.log(JSON.stringify(att.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
};

debug();
