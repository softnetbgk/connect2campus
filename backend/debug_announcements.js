const { pool } = require('./src/config/db');

async function checkAnnouncements() {
    try {
        const res = await pool.query(`
            SELECT id, title, target_role, class_id, section_id, subject_name, staff_role, created_at 
            FROM announcements 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkAnnouncements();
