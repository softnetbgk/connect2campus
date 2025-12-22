const { pool } = require('../config/db');
const { sendAttendanceNotification } = require('../services/notificationService');

// Add a new student
// Add a new student
// Add a new student
const bcrypt = require('bcrypt'); // Import bcrypt

// Add a new student
exports.addStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Start Transaction

        const {
            name, gender, dob, age,
            class_id, section_id,
            father_name, mother_name, contact_number, email, address,
            attendance_id, admission_date
        } = req.body;
        const school_id = req.user.schoolId;

        // Convert empty section_id to null
        const safe_section_id = (section_id === '' || section_id === 'null' || section_id === undefined) ? null : section_id;

        // Generate Admission No if not provided
        let admission_no = req.body.admission_no;
        if (!admission_no) {
            // Generate Student ID: First 2 letters of School Name + 4 Digits
            const schoolRes = await client.query('SELECT name FROM schools WHERE id = $1', [school_id]);
            const schoolName = schoolRes.rows[0]?.name || 'XX';
            const prefix = schoolName.replace(/[^a-zA-Z]/g, '').substring(0, 2).toUpperCase();
            const rand4 = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
            admission_no = `${prefix}${rand4}`;
        }

        // Logic to get roll number (handle null section)
        let rollCheck;
        if (safe_section_id) {
            rollCheck = await client.query('SELECT MAX(roll_number) as max_roll FROM students WHERE class_id = $1 AND section_id = $2', [class_id, safe_section_id]);
        } else {
            rollCheck = await client.query('SELECT MAX(roll_number) as max_roll FROM students WHERE class_id = $1 AND section_id IS NULL', [class_id]);
        }

        const roll_number = (rollCheck.rows[0].max_roll || 0) + 1;

        // 1. Insert Student
        const result = await client.query(
            `INSERT INTO students 
            (school_id, name, admission_no, roll_number, gender, dob, age, class_id, section_id, 
             father_name, mother_name, contact_number, email, address, attendance_id, admission_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
            [school_id, name, admission_no, roll_number, gender, dob, age, class_id, safe_section_id,
                father_name, mother_name, contact_number, email, address, attendance_id, admission_date || new Date()]
        );
        const newStudent = result.rows[0];

        // 2. Create Login for Student
        let loginEmail = email || `${admission_no.toLowerCase()}@student.school.com`;
        const defaultPassword = await bcrypt.hash('123456', 10);

        // Check if user email already exists
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [loginEmail]);

        // If email exists, fallback to Admission No based login
        if (userCheck.rows.length > 0) {
            loginEmail = `${admission_no.toLowerCase()}@student.school.com`;
            // Double check if this fallback also exists (unlikely unless duplicate admission no, which is handled earlier)
            const fallbackCheck = await client.query('SELECT id FROM users WHERE email = $1', [loginEmail]);
            if (fallbackCheck.rows.length > 0) {
                // If even fallback exists, we can't create a user. 
                // This effectively handles the "User already exists" case without crashing, 
                // but ideally we should update the existing user? No, better to safe fail or just log.
                console.warn(`User for student ${admission_no} already exists.`);
            } else {
                await client.query(
                    `INSERT INTO users (email, password, role, school_id) VALUES ($1, $2, 'STUDENT', $3)`,
                    [loginEmail, defaultPassword, school_id]
                );
            }
        } else {
            await client.query(
                `INSERT INTO users (email, password, role, school_id) VALUES ($1, $2, 'STUDENT', $3)`,
                [loginEmail, defaultPassword, school_id]
            );
        }

        await client.query('COMMIT'); // Commit Transaction

        res.status(201).json(newStudent);
    } catch (error) {
        await client.query('ROLLBACK'); // Rollback on error
        console.error(error);
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Duplicate Admission No or Attendance ID. Please try again.' });
        }
        res.status(500).json({ message: 'Server error adding student' });
    } finally {
        client.release();
    }
};

// Get students with filters
exports.getStudents = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { class_id, section_id } = req.query;

        let query = `
            SELECT s.*, c.name as class_name, sec.name as section_name 
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE s.school_id = $1
        `;
        const params = [school_id];

        // ...
        if (class_id || section_id || req.query.search) {
            if (class_id) {
                params.push(class_id);
                query += ` AND s.class_id = $${params.length}`;
            }
            if (section_id) {
                params.push(section_id);
                query += ` AND s.section_id = $${params.length}`;
            }
            if (req.query.search) {
                params.push(`%${req.query.search}%`);
                query += ` AND (s.name ILIKE $${params.length} OR s.admission_no ILIKE $${params.length})`;
            }
            query += ` ORDER BY s.roll_number ASC, s.name ASC`;
        } else {
            // ...
            // Default: Recent 10
            query += ` ORDER BY s.id DESC LIMIT 10`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching students' });
    }
};

// Update student
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, gender, dob, age,
            class_id, section_id,
            father_name, mother_name, contact_number, email, address,
            attendance_id, admission_date
        } = req.body;

        const safe_section_id = (section_id === '' || section_id === 'null' || section_id === undefined) ? null : section_id;

        const result = await pool.query(
            `UPDATE students SET 
            name = $1, gender = $2, dob = $3, age = $4, class_id = $5, section_id = $6, 
            father_name = $7, mother_name = $8, contact_number = $9, email = $10, address = $11, attendance_id = $12, admission_date = $13
            WHERE id = $14 AND school_id = $15 RETURNING *`,
            [name, gender, dob, age, class_id, safe_section_id,
                father_name, mother_name, contact_number, email, address, attendance_id, admission_date,
                id, req.user.schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating student' });
    }
};

// Delete student
exports.deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM students WHERE id = $1 AND school_id = $2 RETURNING *',
            [id, req.user.schoolId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting student' });
    }
};

// Mark Attendance (Bulk)
exports.markAttendance = async (req, res) => {
    const client = await pool.connect();
    try {
        const { date, attendanceData } = req.body; // attendanceData: [{ student_id, status }]
        const school_id = req.user.schoolId;

        await client.query('BEGIN');

        for (const record of attendanceData) {
            await client.query(
                `INSERT INTO attendance(school_id, student_id, date, status)
                VALUES($1, $2, $3, $4)
                ON CONFLICT(student_id, date) 
                DO UPDATE SET status = EXCLUDED.status`,
                [school_id, record.student_id, date, record.status]
            );

            // Send Notification (Fire & Forget to avoid blocking bulk update)
            // Querying student details for each might be slow for large classes, optimize later
            if (record.status === 'Present' || record.status === 'Absent') {
                client.query('SELECT name, contact_number FROM students WHERE id = $1', [record.student_id])
                    .then(res => {
                        if (res.rows.length > 0) {
                            sendAttendanceNotification(res.rows[0], record.status);
                        }
                    })
                    .catch(err => console.error('Error fetching student for notification', err));
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Attendance updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error marking attendance' });
    } finally {
        client.release();
    }
};

// Get Attendance Report
exports.getAttendanceReport = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { class_id, section_id, month, year } = req.query;

        // Construct date range for the month
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

        let query = `
            SELECT s.id as student_id, s.name, a.date, a.status
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date >= $2 AND a.date <= $3
            WHERE s.school_id = $1
            `;
        const params = [school_id, startDate, endDate];

        if (class_id) {
            params.push(class_id);
            query += ` AND s.class_id = $${params.length}`;
        }
        if (section_id) {
            params.push(section_id);
            query += ` AND s.section_id = $${params.length}`;
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching attendance' });
    }
};

// Get My Attendance Report (For Students)
// Get My Attendance Report
exports.getMyAttendanceReport = async (req, res) => {
    try {
        const { id, role, email, schoolId, linkedId } = req.user;
        let student_id = linkedId;

        // Fallback Logic
        if (!student_id && role === 'STUDENT') {
            const studentRes = await pool.query(
                'SELECT id FROM students WHERE school_id = $1 AND LOWER(email) = LOWER($2)',
                [schoolId, email]
            );
            if (studentRes.rows.length > 0) student_id = studentRes.rows[0].id;
            else {
                const prefix = email.split('@')[0];
                const s2 = await pool.query('SELECT id FROM students WHERE admission_no = $1', [prefix]);
                if (s2.rows.length > 0) student_id = s2.rows[0].id;
            }
        }

        if (!student_id) return res.status(404).json({ message: 'Student profile not found' });

        const { month, year } = req.query;

        // 1. Fetch Daily Records
        let query = `
            SELECT status, TO_CHAR(date, 'YYYY-MM-DD') as date_str
            FROM attendance
            WHERE student_id = $1
        `;
        const params = [student_id];

        if (month && year) {
            query += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
            params.push(month, year);
        }

        query += ` ORDER BY date ASC`;

        const result = await pool.query(query, params);

        const report = result.rows.reduce((acc, row) => {
            acc[row.date_str] = row.status;
            return acc;
        }, {});

        // 2. Fetch Aggregated Stats
        let statsQuery = `
            SELECT 
                COUNT(*) as total_days,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) as half_days
            FROM attendance
            WHERE student_id = $1
        `;
        // Reuse params structure but verify logic
        const statsParams = [student_id];
        if (month && year) {
            statsQuery += ` AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
            statsParams.push(month, year);
        }

        const statsRes = await pool.query(statsQuery, statsParams);
        const stats = statsRes.rows[0];

        const total = parseInt(stats.total_days || 0);
        const present = parseInt(stats.present_days || 0);
        const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        res.json({
            attendancePercentage: percentage,
            totalDays: total,
            presentDays: present,
            absentDays: parseInt(stats.absent_days || 0),
            lateDays: parseInt(stats.late_days || 0),
            halfDays: parseInt(stats.half_days || 0),
            report: report, // CRITICAL: This was missing in response
            monthlyRecords: result.rows
        });

    } catch (error) {
        console.error('Error fetching my attendance:', error);
        res.status(500).json({ message: 'Server error fetching attendance' });
    }
};

// Get Attendance Summary (Daily Class-wise)
exports.getAttendanceSummary = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { date } = req.query;

        const query = `
            SELECT 
                c.name as class_name, 
                sec.name as section_name, 
                COUNT(s.id) as total_students,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late_count,
                SUM(CASE WHEN a.status IS NULL THEN 1 ELSE 0 END) as not_marked_count
            FROM students s
            JOIN classes c ON s.class_id = c.id
            JOIN sections sec ON s.section_id = sec.id
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $2
            WHERE s.school_id = $1
            GROUP BY c.name, sec.name
            ORDER BY c.name, sec.name
        `;

        const result = await pool.query(query, [school_id, date]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching attendance summary' });
    }
};

// Get Daily Attendance Details (List of students with status)
exports.getDailyAttendance = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { date, class_id, section_id } = req.query;

        if (!class_id || !date) {
            return res.status(400).json({ message: 'Class and Date are required' });
        }

        let query = `
            SELECT s.id, s.name, s.roll_number, COALESCE(a.status, 'Unmarked') as status
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = $2
            WHERE s.school_id = $1 AND s.class_id = $3
        `;

        const params = [school_id, date, class_id];

        if (section_id) {
            params.push(section_id);
            query += ` AND s.section_id = $${params.length}`;
        }

        query += ` ORDER BY s.roll_number ASC, s.name ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching daily attendance' });
    }
};

// Reorder Roll Numbers
exports.reorderRollNumbers = async (req, res) => {
    const client = await pool.connect();
    try {
        const { class_id, section_id } = req.body;
        const school_id = req.user.schoolId;

        await client.query('BEGIN');

        // Fetch all students in this class/section ordered by Name
        const studentsRef = await client.query(
            `SELECT id FROM students 
             WHERE school_id = $1 AND class_id = $2 AND section_id = $3 
             ORDER BY name ASC`,
            [school_id, class_id, section_id]
        );

        // Update each student with new roll number
        for (let i = 0; i < studentsRef.rows.length; i++) {
            await client.query(
                `UPDATE students SET roll_number = $1 WHERE id = $2`,
                [i + 1, studentsRef.rows[i].id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Roll numbers updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error reordering roll numbers' });
    } finally {
        client.release();
    }
};
// Get Student Profile (Logged In)
// Get Student Profile (Logged In)
exports.getStudentProfile = async (req, res) => {
    try {
        const { email, schoolId } = req.user;

        // 1. Try matching by email directly
        let query = `
            SELECT s.*, c.name as class_name, sec.name as section_name 
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN sections sec ON s.section_id = sec.id
            WHERE s.school_id = $1 AND LOWER(s.email) = LOWER($2)
        `;
        let result = await pool.query(query, [schoolId, email]);

        // 2. If not found, check if email is pattern-based (admission_no@student.school.com)
        if (result.rows.length === 0) {
            const emailParts = email.split('@');
            if (emailParts.length === 2) {
                // Assume the part before @ is the admission number (case insensitive)
                const possibleAdmissionNo = emailParts[0];
                query = `
                    SELECT s.*, c.name as class_name, sec.name as section_name 
                    FROM students s
                    LEFT JOIN classes c ON s.class_id = c.id
                    LEFT JOIN sections sec ON s.section_id = sec.id
                    WHERE s.school_id = $1 AND LOWER(s.admission_no) = LOWER($2)
                `;
                result = await pool.query(query, [schoolId, possibleAdmissionNo]);
            }
        }

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// Get My Fees (for Students)
// Get My Fees (for Students)
// Get My Fees (for Students)
exports.getMyFees = async (req, res) => {
    try {
        console.log('[getMyFees] Request started for user:', req.user.email);
        const { id, role, email, schoolId, linkedId } = req.user;
        let student_id = linkedId;

        if (!student_id && role === 'STUDENT') {
            console.log('[getMyFees] linkedId missing, attempting fallback lookup...');
            const studentRes = await pool.query(
                'SELECT id FROM students WHERE school_id = $1 AND LOWER(email) = LOWER($2)',
                [schoolId, email]
            );
            if (studentRes.rows.length > 0) {
                student_id = studentRes.rows[0].id;
                console.log('[getMyFees] Found student via email:', student_id);
            } else {
                const prefix = email.split('@')[0];
                const studentRes2 = await pool.query(
                    'SELECT id FROM students WHERE school_id = $1 AND LOWER(admission_no) = LOWER($2)',
                    [schoolId, prefix]
                );
                if (studentRes2.rows.length > 0) {
                    student_id = studentRes2.rows[0].id;
                    console.log('[getMyFees] Found student via admission_no:', student_id);
                }
            }
        }

        console.log('[getMyFees] Resolved student_id:', student_id);

        if (!student_id) {
            console.log('[getMyFees] Failed to resolve student ID.');
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // 1. Fetch Paid History
        console.log('[getMyFees] Fetching payments...');
        const payments = await pool.query(`
            SELECT p.id, p.amount_paid as amount, TO_CHAR(p.payment_date, 'YYYY-MM-DD') as date, p.payment_method, p.receipt_no, fs.title as "feeType"
            FROM fee_payments p
            JOIN fee_structures fs ON p.fee_structure_id = fs.id
            WHERE p.student_id = $1
            ORDER BY p.payment_date DESC
        `, [student_id]);
        console.log(`[getMyFees] Payments fetched: ${payments.rows.length}`);

        // 2. Calculate Totals
        console.log('[getMyFees] Fetching student class info...');
        const studentInfo = await pool.query('SELECT class_id FROM students WHERE id = $1', [student_id]);

        if (studentInfo.rows.length === 0) {
            console.log('[getMyFees] Student ID exists but record not found in DB!');
            return res.status(404).json({ message: 'Student record not found' });
        }

        const class_id = studentInfo.rows[0].class_id;
        console.log('[getMyFees] Found class_id:', class_id);

        let totalFees = 0;
        let paidAmount = 0;

        if (class_id) {
            console.log('[getMyFees] Fetching fee structures...');
            const structures = await pool.query('SELECT amount FROM fee_structures WHERE class_id = $1 AND school_id = $2', [class_id, schoolId]);
            console.log(`[getMyFees] Structures found: ${structures.rows.length}`);
            structures.rows.forEach(s => totalFees += parseFloat(s.amount || 0));
        } else {
            console.log('[getMyFees] No class_id found for student.');
        }

        payments.rows.forEach(p => {
            paidAmount += parseFloat(p.amount || 0);
        });

        let pendingAmount = totalFees - paidAmount;
        if (pendingAmount < 0) pendingAmount = 0;

        const responseData = {
            totalFees,
            paidAmount,
            pendingAmount,
            paymentHistory: payments.rows
        };

        console.log('[getMyFees] Sending response:', responseData);
        res.json(responseData);

    } catch (error) {
        console.error('[getMyFees] Critical Error:', error);
        res.status(500).json({ message: 'Server error fetching fees', error: error.message });
    }
};
