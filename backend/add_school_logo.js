const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addLogoColumn() {
    try {
        console.log('Adding logo column to schools table...');
        await pool.query("ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo TEXT");
        console.log('✅ Column added successfully.');
    } catch (e) {
        console.error('Error adding column:', e);
    } finally {
        pool.end();
    }
}

addLogoColumn();
