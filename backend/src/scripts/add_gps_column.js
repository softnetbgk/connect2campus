const { pool } = require('../config/db');

async function updateSchema() {
    try {
        console.log('Running schema update...');

        await pool.query(`
            ALTER TABLE transport_vehicles 
            ADD COLUMN IF NOT EXISTS gps_device_id VARCHAR(255) UNIQUE;
        `);

        console.log('Successfully added gps_device_id column to transport_vehicles table');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        pool.end();
    }
}

updateSchema();
