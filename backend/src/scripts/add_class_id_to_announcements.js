const { pool } = require('../config/db');

const addColumn = async () => {
    try {
        await pool.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES classes(id)');
        console.log("Column class_id added to announcements table.");
    } catch (e) {
        console.error("Error adding column:", e);
    } finally {
        pool.end();
    }
};

addColumn();
