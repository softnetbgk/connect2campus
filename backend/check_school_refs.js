const { pool } = require('./src/config/db');

async function check() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT
                tc.table_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='schools';
        `);
        const tables = res.rows.map(r => r.table_name);
        console.log(`FOUND ${tables.length} TABLES referencing schools:`);
        tables.forEach(t => console.log(`- ${t}`));
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
check();
