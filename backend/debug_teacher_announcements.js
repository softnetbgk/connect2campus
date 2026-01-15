
require('dotenv').config();
const { pool } = require('./src/config/db');

async function testQuery() {
    // SIMULATED TEACHER SESSION
    const school_id = 1;
    const role = 'TEACHER';
    const user_id = 10; // dummy

    let query = `
        SELECT a.id, a.title, a.target_role
        FROM announcements a
        WHERE 1=1
    `;
    const params = [];

    // School Filter
    params.push(school_id);
    query += ` AND (a.school_id = $${params.length} OR a.school_id IS NULL)`;

    // Role-based Access Control
    if (role !== 'SCHOOL_ADMIN' && role !== 'SUPER_ADMIN') {
        const roleConditions = ["a.target_role = 'All'"];

        if (role === 'STUDENT') {
            roleConditions.push("a.target_role = 'Student'");
        } else if (role === 'TEACHER') {
            roleConditions.push("a.target_role = 'Teacher'");
        } else if (['STAFF', 'DRIVER', 'TRANSPORT_MANAGER', 'LIBRARIAN', 'ACCOUNTANT'].includes(role)) {
            roleConditions.push("a.target_role = 'Staff'");
        }

        query += ` AND (${roleConditions.join(' OR ')})`;

        // THE HAMMER: Final layer of isolation
        if (role === 'STUDENT') {
            query += ` AND a.target_role NOT IN ('Teacher', 'Staff')`;
        } else if (role === 'TEACHER') {
            query += ` AND a.target_role NOT IN ('Student', 'Staff', 'Class')`;
        } else if (['STAFF', 'DRIVER'].includes(role)) {
            query += ` AND a.target_role NOT IN ('Student', 'Teacher', 'Class')`;
        }
    }

    console.log("EXECUTING QUERY:", query);
    console.log("WITH PARAMS:", params);

    try {
        const res = await pool.query(query, params);
        console.log("RESULTS FOUND FOR TEACHER:", res.rows.length);
        console.log("RESULTS:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

testQuery();
