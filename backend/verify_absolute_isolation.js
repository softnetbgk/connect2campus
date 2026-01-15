const { pool } = require('./src/config/db');

async function verifyIsolation() {
    const client = await pool.connect();
    try {
        console.log("--- 1. SETUP: Creating Test Data ---");
        // Clean old tests
        await client.query("DELETE FROM announcements WHERE title LIKE 'TEST_ISO_%'");

        // Mock IDs
        const school_id = 1;
        const class_1_id = 101;
        const class_2_id = 102;

        // Insert Scenarios
        const scenarios = [
            { title: 'TEST_ISO_ALL', target: 'All', msg: 'For Everyone' },
            { title: 'TEST_ISO_STUDENT_ALL', target: 'Student', msg: 'For All Students' },
            { title: 'TEST_ISO_CLASS_1', target: 'Class', class_id: class_1_id, msg: 'For Class 1 Only' },
            { title: 'TEST_ISO_TEACHER', target: 'Teacher', msg: 'For Teachers' },
            { title: 'TEST_ISO_STAFF', target: 'Staff', msg: 'For Staff' },
        ];

        for (const s of scenarios) {
            await client.query(
                `INSERT INTO announcements (school_id, title, message, target_role, class_id, created_by, created_at) 
                 VALUES ($1, $2, $3, $4, $5, 1, NOW())`,
                [school_id, s.title, s.msg, s.target, s.class_id || null]
            );
        }
        console.log("-> Test Announcements Inserted.");

        // --- SIMULATION FUNCTIONS ---

        const runQuery = async (role, conditions, params) => {
            let q = `
                SELECT title, target_role FROM announcements a 
                WHERE school_id = $1 
                AND title LIKE 'TEST_ISO_%'
                AND (${conditions})
            `;
            // Add negative checks logic manually to match Controller
            if (role === 'TEACHER') q += ` AND a.target_role NOT IN ('Student', 'Staff')`;
            if (role === 'STAFF') q += ` AND a.target_role NOT IN ('Student', 'Teacher', 'Subject', 'Class')`;

            return (await client.query(q, params)).rows.map(r => r.title);
        };

        // 1. TEACHER VIEW
        // Logic: All OR Teacher OR (Subject match)
        console.log("\n--- TEST: TEACHER VIEW ---");
        const teacherView = await runQuery('TEACHER', "a.target_role = 'All' OR a.target_role = 'Teacher'", [school_id]);
        console.log("Seen by Teacher:", teacherView);
        if (teacherView.includes('TEST_ISO_STUDENT_ALL') || teacherView.includes('TEST_ISO_CLASS_1')) {
            console.error("!!! FAIL: Teacher sees Student/Class content!");
        } else {
            console.log(">>> PASS: Teacher is isolated.");
        }

        // 2. STAFF VIEW
        // Logic: All OR Staff OR (Role match)
        console.log("\n--- TEST: STAFF VIEW ---");
        const staffView = await runQuery('STAFF', "a.target_role = 'All' OR a.target_role = 'Staff'", [school_id]);
        console.log("Seen by Staff:", staffView);
        if (staffView.includes('TEST_ISO_STUDENT_ALL') || staffView.includes('TEST_ISO_TEACHER')) {
            console.error("!!! FAIL: Staff sees Student/Teacher content!");
        } else {
            console.log(">>> PASS: Staff is isolated.");
        }

        // 3. STUDENT (Class 1) VIEW
        // Logic: All OR Student OR (Class match)
        console.log("\n--- TEST: STUDENT (Class 1) VIEW ---");
        // Simulate Student in Class 1
        const s1Params = [school_id, class_1_id];
        // student role logic: All OR Student OR (Class... )
        const s1Cond = `a.target_role = 'All' OR a.target_role = 'Student' OR (a.target_role = 'Class' AND a.class_id = $2)`;

        const s1View = await runQuery('STUDENT', s1Cond, s1Params);
        console.log("Seen by Student (Class 1):", s1View);

        if (!s1View.includes('TEST_ISO_CLASS_1')) console.error("!!! FAIL: Student 1 didn't see Class 1 msg");
        if (s1View.includes('TEST_ISO_TEACHER')) console.error("!!! FAIL: Student 1 sees Teacher msg");
        if (s1View.includes('TEST_ISO_STAFF')) console.error("!!! FAIL: Student 1 sees Staff msg");

        // 4. STUDENT (Class 2) VIEW
        console.log("\n--- TEST: STUDENT (Class 2) VIEW ---");
        const s2Params = [school_id, class_2_id];
        const s2Cond = `a.target_role = 'All' OR a.target_role = 'Student' OR (a.target_role = 'Class' AND a.class_id = $2)`;
        const s2View = await runQuery('STUDENT', s2Cond, s2Params);
        console.log("Seen by Student (Class 2):", s2View);

        if (s2View.includes('TEST_ISO_CLASS_1')) console.error("!!! FAIL: Student 2 saw Class 1 msg!");
        else console.log(">>> PASS: Student 2 did NOT see Class 1 msg.");

    } catch (err) {
        console.error("CRITICAL ERROR:", err);
    } finally {
        await client.query("DELETE FROM announcements WHERE title LIKE 'TEST_ISO_%'");
        client.release();
        pool.end();
    }
}

verifyIsolation();
