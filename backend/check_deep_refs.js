const { pool } = require('./src/config/db');

const tables = ['students', 'teachers', 'staff', 'classes', 'users'];

async function check() {
    const client = await pool.connect();
    try {
        for (const t of tables) {
            console.log(`\nREFERENCES TO ${t.toUpperCase()}:`);
            const res = await client.query(`
                SELECT tc.table_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name=$1
            `, [t]);
            res.rows.forEach(r => console.log(`- ${r.table_name}`));
        }
    } catch (e) { console.error(e); }
    finally { client.release(); pool.end(); }
}
check();
