const { pool } = require('../config/db');

const addSectionColumn = async () => {
    try {
        await pool.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS section_id INTEGER REFERENCES sections(id)');
        console.log("Column section_id added to announcements table.");
    } catch (e) {
        console.error("Error adding column:", e);
    } finally {
        pool.end();
    }
};

addSectionColumn();
