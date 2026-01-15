require('dotenv').config();
const { pool } = require('./src/config/db');

async function debugLatest() {
    const client = await pool.connect();
    try {
        console.log("--- LATEST 20 ANNOUNCEMENTS (RAW) ---");
        const res = await client.query(`
            SELECT id, title, target_role, class_id, section_id, subject_name, staff_role, created_at 
            FROM announcements 
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        res.rows.forEach(r => {
            console.log(`ID: ${r.id} | Title: ${r.title} | Target: ${r.target_role} | Class: ${r.class_id} | Subj: ${r.subject_name} | Role: ${r.staff_role} | Date: ${r.created_at}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

debugLatest();
