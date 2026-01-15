require('dotenv').config();
const { pool } = require('./src/config/db');

async function testTeacherView() {
    const client = await pool.connect();
    try {
        // Mock a teacher user context
        // We'll search for a teacher in the DB First
        const teacherUser = await client.query(`
            SELECT u.id, u.role, u.school_id 
            FROM users u 
            WHERE role = 'TEACHER' 
            LIMIT 1
        `);

        if (teacherUser.rows.length === 0) {
            console.log("No teacher found to test with.");
            return;
        }

        const { id: user_id, role, school_id } = teacherUser.rows[0];
        console.log(`Testing for User ID: ${user_id}, Role: ${role}, School ID: ${school_id}`);

        // Logic from getAnnouncements
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
        if (role === 'TEACHER') {
            params.push('Teacher');
            roleConditions.push(`a.target_role = $${params.length}`);

            const teacherRes = await client.query(
                `SELECT t.id, t.subject_specialization 
                 FROM teachers t 
                 JOIN users u ON t.email = u.email 
                 WHERE u.id = $1 AND t.school_id = $2`,
                [user_id, school_id]
            );

            if (teacherRes.rows.length > 0) {
                const { subject_specialization } = teacherRes.rows[0];
                if (subject_specialization) {
                    params.push(subject_specialization);
                    roleConditions.push(`(a.target_role = 'Subject' AND a.subject_name = $${params.length})`);
                }
            }
        }

        query += ` AND (${roleConditions.join(' OR ')})`;

        if (role === 'TEACHER') {
            query += ` AND a.target_role NOT IN ('Student', 'Staff', 'Class', 'Role')`;
        }

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

testTeacherView();
