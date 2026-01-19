
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runTest() {
    try {
        const log = (msg) => {
            console.log(msg);
            fs.appendFileSync('test_result.txt', msg + '\n');
        };

        if (fs.existsSync('test_result.txt')) fs.unlinkSync('test_result.txt');

        log('--- Starting Vacate Logic Test ---');
        
        // 1. Find a student
        const studentRes = await pool.query("SELECT id, name, admission_no, email FROM students LIMIT 1");
        if (studentRes.rows.length === 0) {
            log('No students found to test.');
            return;
        }
        const student = studentRes.rows[0];
        log(`Testing with Student: ${student.name} (${student.admission_no})`);

        // 2. Find a hostel room
        const roomRes = await pool.query("SELECT id, room_number, hostel_id FROM hostel_rooms LIMIT 1");
        if (roomRes.rows.length === 0) {
            log('No rooms found to test.');
            return;
        }
        const room = roomRes.rows[0];
        log(`Testing with Room: ${room.room_number}`);

        // 3. Clean up any existing allocations for this student (to be safe)
        await pool.query("DELETE FROM hostel_allocations WHERE student_id = $1", [student.id]);
        log('Cleaned up existing allocations.');

        // 4. Allocate Room
        log('Allocating room...');
        await pool.query(
            "INSERT INTO hostel_allocations (student_id, room_id, status, allocation_date) VALUES ($1, $2, 'Active', CURRENT_DATE)",
            [student.id, room.id]
        );

        // 5. Check 'getMyHostelDetails' logic (simulate the query)
        log('Checking details (should be Allocated)...');
        let result = await pool.query(`
            SELECT s.id, a.id as allocation_id, a.status as allocation_status
            FROM students s
            LEFT JOIN hostel_allocations a ON s.id = a.student_id AND a.status = 'Active'
            WHERE s.id = $1
        `, [student.id]);
        
        if (result.rows[0].allocation_id) {
            log('PASS: Student is correctly identified as ALLOCATED.');
        } else {
            log('FAIL: Student should be allocated but is not.');
        }

        // 6. Vacate Room
        log('Vacating room...');
        await pool.query(
            "UPDATE hostel_allocations SET status = 'Vacated', vacating_date = CURRENT_DATE WHERE student_id = $1 AND status = 'Active'",
            [student.id]
        );

        // 7. Check 'getMyHostelDetails' logic again
        log('Checking details (should be NOT Allocated)...');
        result = await pool.query(`
            SELECT s.id, a.id as allocation_id, a.status as allocation_status
            FROM students s
            LEFT JOIN hostel_allocations a ON s.id = a.student_id AND a.status = 'Active'
            WHERE s.id = $1
        `, [student.id]);

        if (!result.rows[0].allocation_id) {
            log('PASS: Student is correctly identified as NOT ALLOCATED.');
        } else {
            log(`FAIL: Student is still allocated! Status: ${result.rows[0].allocation_status}, Alloc ID: ${result.rows[0].allocation_id}`);
        }

        // Cleanup
        await pool.query("DELETE FROM hostel_allocations WHERE student_id = $1", [student.id]);
        log('Test Cleanup Done.');

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await pool.end();
    }
}

runTest();
