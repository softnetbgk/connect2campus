const { pool } = require('../config/db');

const debug = async () => {
    try {
        console.log('Testing Mess Query...');
        const messQuery = `
            SELECT b.id, s.name, s.admission_no, b.amount, b.month, b.year 
            FROM hostel_mess_bills b 
            JOIN students s ON b.student_id = s.id 
            WHERE b.status = 'Pending'
        `;
        const messRes = await pool.query(messQuery);
        console.log('Mess Query Success. Rows:', messRes.rows.length);

        const messDues = messRes.rows.map(row => ({
            id: `mess_${row.id}`,
            student_id: row.id,
            name: row.name,
            admission_no: row.admission_no,
            amount: row.amount,
            type: 'Mess Bill',
            period: `${row.month} ${row.year}`
        }));
        console.log('Mess Mapping Success');

        console.log('Testing Rent Query...');
        const rentQuery = `
            SELECT s.id, s.name, s.admission_no, r.cost_per_term,
                   COALESCE(SUM(p.amount), 0) as paid_amount
            FROM students s
            JOIN hostel_allocations a ON s.id = a.student_id
            JOIN hostel_rooms r ON a.room_id = r.id
            LEFT JOIN hostel_payments p ON s.id = p.student_id AND p.payment_type = 'Room Rent'
            WHERE a.status = 'Active'
            GROUP BY s.id, r.id
            HAVING COALESCE(SUM(p.amount), 0) < r.cost_per_term
        `;
        const rentRes = await pool.query(rentQuery);
        console.log('Rent Query Success. Rows:', rentRes.rows.length);

        const rentDues = rentRes.rows.map(row => ({
            id: `rent_${row.id}`,
            student_id: row.id,
            name: row.name,
            admission_no: row.admission_no,
            amount: (parseFloat(row.cost_per_term) - parseFloat(row.paid_amount)).toFixed(2),
            type: 'Room Rent',
            period: 'Current Term'
        }));
        console.log('Rent Mapping Success');

        const allDues = [...messDues, ...rentDues].sort((a, b) => a.name.localeCompare(b.name));
        console.log('Sorting Success. Total items:', allDues.length);
        console.log('Sample item:', allDues[0]);

        process.exit(0);
    } catch (error) {
        console.error('Debug Failed:', error);
        process.exit(1);
    }
};

debug();
