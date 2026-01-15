const { pool } = require('../config/db');

const addExtraColumns = async () => {
    try {
        await pool.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS subject_name VARCHAR(100)');
        await pool.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS staff_role VARCHAR(100)');
        console.log("Columns subject_name and staff_role added to announcements table.");
    } catch (e) {
        console.error("Error adding columns:", e);
    } finally {
        pool.end();
    }
};

addExtraColumns();
