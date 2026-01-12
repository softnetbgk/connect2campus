const { pool } = require('./src/config/db');

(async () => {
    try {
        await pool.query("ALTER TABLE schools ADD COLUMN has_hostel BOOLEAN DEFAULT TRUE");
        console.log("Column 'has_hostel' added successfully.");
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log("Column 'has_hostel' already exists.");
        } else {
            console.error("Error adding column:", e);
        }
    } finally {
        process.exit(0);
    }
})();
