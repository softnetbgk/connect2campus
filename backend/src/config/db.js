const { Pool } = require('pg');
require('dotenv').config();

const getConnectionString = () => {
    if (process.env.NODE_ENV === 'test') {
        return process.env.TEST_DATABASE_URL;
    }
    if (process.env.NODE_ENV === 'production') {
        return process.env.PROD_DATABASE_URL;
    }
    return process.env.DATABASE_URL;
};

const pool = new Pool({
    connectionString: getConnectionString() || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
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
