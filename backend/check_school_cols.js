const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'schools'")
    .then(r => {
        console.log('Columns:', r.rows.map(x => x.column_name));
        pool.end();
    })
    .catch(e => {
        console.error(e);
        pool.end();
    });
