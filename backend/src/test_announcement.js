const { pool } = require('./config/db');

async function testQuery() {
    try {
        console.log("Testing Announcement Query...");
        const school_id = 1; // Assume school 1
        const role = 'STUDENT';
        const user_id = 14;

        // Mock query logic from controller
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

            // Assume student class=1, section=1
            const class_id = 1;
            const section_id = 1;

            if (class_id) {
                params.push(class_id);
                let clsCond = `(a.target_role = 'Class' AND a.class_id = $${params.length}`;

                if (section_id) {
                    params.push(section_id);
                    clsCond += ` AND (a.section_id IS NULL OR a.section_id = $${params.length}))`;
                } else {
                    clsCond += `)`;
                }
                roleConditions.push(clsCond);
            }
        }

        query += ` AND (${roleConditions.join(' OR ')})`;
        query += ` ORDER BY a.created_at DESC`;

        console.log("Query:", query);
        console.log("Params:", params);

        const res = await pool.query(query, params);
        console.log(`Found ${res.rows.length} announcements`);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

testQuery();
