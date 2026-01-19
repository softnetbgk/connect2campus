
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runTest() {
    try {
        console.log('--- Testing /hostel/finance/pending-dues Logic ---');

        // Mock req.user.schoolId
        // Need to find a valid school_id first
        const schoolRes = await pool.query("SELECT id FROM schools LIMIT 1");
        if (schoolRes.rows.length === 0) {
            console.log('No school found.');
            return;
        }
        const schoolId = schoolRes.rows[0].id;
        console.log(`Using School ID: ${schoolId}`);

        console.log('Fetching Pending Dues...');

        // Simulating the controller logic
        // 1. Pending Mess Bills
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const currentYear = new Date().getFullYear();

        let messQuery = `
            SELECT b.id, b.student_id, s.name, s.admission_no, b.amount, b.month, b.year 
            FROM hostel_mess_bills b 
            JOIN students s ON b.student_id = s.id 
            WHERE b.status = 'Pending' AND s.school_id = $1 AND (s.status IS NULL OR s.status != 'Deleted')
        `;
        messQuery += ` ORDER BY b.year DESC, b.month DESC`;

        console.log('Executing Mess Query...');
        const messRes = await pool.query(messQuery, [schoolId]);
        console.log(`Mess Bills Found: ${messRes.rows.length}`);

        // 2. Pending Room Rent
        console.log('Executing Rent Query...');
        const rentQuery = `
            SELECT s.id, s.name, s.admission_no, r.cost_per_term,
                   COALESCE(SUM(p.amount), 0) as paid_amount
            FROM students s
            JOIN hostel_allocations a ON s.id = a.student_id
            JOIN hostel_rooms r ON a.room_id = r.id
            LEFT JOIN hostel_payments p ON s.id = p.student_id AND p.payment_type = 'Room Rent'
            WHERE a.status = 'Active' AND s.school_id = $1 AND (s.status IS NULL OR s.status != 'Deleted')
            GROUP BY s.id, r.id, r.cost_per_term
            HAVING COALESCE(SUM(p.amount), 0) < CAST(r.cost_per_term AS NUMERIC)
        `;
        const rentRes = await pool.query(rentQuery, [schoolId]);
        console.log(`Rent Dues Found: ${rentRes.rows.length}`);

        const rentDues = rentRes.rows.map(row => ({
            id: `rent_${row.id}`,
            student_id: row.id,
            name: row.name || 'Unknown',
            admission_no: row.admission_no || '-',
            amount: (parseFloat(row.cost_per_term || 0) - parseFloat(row.paid_amount || 0)).toFixed(2),
            type: 'Room Rent',
            period: 'Current Term'
        }));

        console.log('Sample Rent Due:', rentDues[0]);

        console.log('--- Test Complete: Success ---');

    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error);
    } finally {
        await pool.end();
    }
}

runTest();
