const { Pool } = require('pg');
require('dotenv').config();

const getConnectionString = () => {
    // For develop branch, the default is always Supabase Testing
    if (process.env.NODE_ENV === 'production') {
        process.env.DB_ENV_LABEL = 'PRODUCTION (AWS/SUPA_PROD)';
        return process.env.PROD_DATABASE_URL;
    }

    process.env.DB_ENV_LABEL = 'DEVELOP (SUPABASE OLD/ORIGINAL)';
    return process.env.DATABASE_URL; // Now points to myproject_test_db
};

const connectionString = getConnectionString();
console.log(`🌿 Branch: Develop | 🌐 DB: ${process.env.DB_ENV_LABEL}`);

const pool = new Pool({
    connectionString: connectionString || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: { rejectUnauthorized: false }, // Force SSL for Supabase
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // process.exit(-1); // Don't crash the server
});

module.exports = { pool };
