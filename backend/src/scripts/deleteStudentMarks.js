const { pool } = require('../config/db');

const deleteMarksForStudent = async () => {
    try {
        // CHANGE THIS to the student ID you want to clear
        const studentId = 40; // ← PUT THE NEW STUDENT'S ID HERE

        console.log(`\n🗑️  Deleting all marks for student ID: ${studentId}`);

        const result = await pool.query('DELETE FROM marks WHERE student_id = $1', [studentId]);

        console.log(`✅ Deleted ${result.rowCount} marks`);
        console.log('This student now has empty marks fields.\n');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

deleteMarksForStudent();
