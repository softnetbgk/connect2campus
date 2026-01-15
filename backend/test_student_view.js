require('dotenv').config();
const { pool } = require('./src/config/db');

async function testStudentView() {
    const client = await pool.connect();
    try {
        const studentUser = await client.query(`
            SELECT u.id, u.role, u.school_id 
            FROM users u 
            WHERE role = 'STUDENT' 
            LIMIT 1
        `);

        if (studentUser.rows.length === 0) {
            console.log("No student found to test with.");
            return;
        }

        const { id: user_id, role, school_id } = studentUser.rows[0];
        console.log(`Testing for User ID: ${user_id}, Role: ${role}, School ID: ${school_id}`);

        let query = `
            SELECT a.*, c.name as class_name, s.name as section_name
            FROM announcements a
            LEFT JOIN classes c ON a.class_id = c.id
            LEFT JOIN sections s ON a.section_id = s.id
            LEFT JOIN users u ON a.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (school_id) {
            params.push(school_id);
            query += ` AND (a.school_id = $${params.length} OR a.school_id IS NULL)`;
        }

        const roleConditions = ["a.target_role = 'All'"];
        if (role === 'STUDENT') {
            params.push('Student');
            roleConditions.push(`a.target_role = $${params.length}`);

            const studentRes = await client.query(
                `SELECT s.class_id, s.section_id 
                    FROM students s 
                    JOIN users u ON s.email = u.email 
                    WHERE u.id = $1 AND s.school_id = $2`,
                [user_id, school_id]
            );

            if (studentRes.rows.length > 0) {
                const { class_id, section_id } = studentRes.rows[0];
                if (class_id) {
                    params.push(class_id);
                    let clsCond = `(a.target_role = 'Class' AND a.class_id = $${params.length})`;
                    roleConditions.push(clsCond);
                }
            }
        }

        query += ` AND (${roleConditions.join(' OR ')})`;

        query += ` ORDER BY a.created_at DESC`;

        console.log("Generated Query:", query);
        console.log("Params:", params);

        const res = await client.query(query, params);
        console.log(`Results found: ${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(` - ID: ${r.id}, Title: ${r.title}, Target: ${r.target_role}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

testStudentView();
