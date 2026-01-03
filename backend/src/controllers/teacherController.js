const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// Add Teacher
exports.addTeacher = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { name, email, phone, subject_specialization, gender, address, join_date, assign_class_id, assign_section_id, salary_per_day } = req.body;

        await client.query('BEGIN');

        // 1. Check if phone number already exists
        if (phone) {
            const phoneCheck = await client.query(
                'SELECT id, name FROM teachers WHERE phone = $1 AND school_id = $2',
                [phone, school_id]
            );
            if (phoneCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: `Phone number already exists for teacher: ${phoneCheck.rows[0].name}`
                });
            }
        }

        // 1.1 Check if email already exists
        if (email) {
            const emailCheck = await client.query(
                'SELECT id, name FROM teachers WHERE email = $1 AND school_id = $2',
                [email, school_id]
            );
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: `Email already exists for teacher: ${emailCheck.rows[0].name}`
                });
            }
        }

        // 2. Generate Employee ID - NEW FORMAT: [School First Letter]T[4 digits]
        // Example: ABC School -> AT1234
        const schoolRes = await client.query('SELECT name FROM schools WHERE id = $1', [school_id]);
        const schoolName = schoolRes.rows[0]?.name || 'X';
        const firstLetter = schoolName.replace(/[^a-zA-Z]/g, '').substring(0, 1).toUpperCase() || 'X';

        let employee_id;
        let isUnique = false;
        while (!isUnique) {
            const rand4 = Math.floor(1000 + Math.random() * 9000); // 1000 to 9999
            employee_id = `${firstLetter}T${rand4}`;
            const check = await client.query('SELECT 1 FROM teachers WHERE employee_id = $1 AND school_id = $2', [employee_id, school_id]);
            if (check.rows.length === 0) isUnique = true;
        }

        // 2. Insert Teacher
        const result = await client.query(
            `INSERT INTO teachers (school_id, name, email, phone, subject_specialization, gender, address, join_date, employee_id, salary_per_day)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [school_id, name, email, phone, subject_specialization, gender, address, join_date || new Date(), employee_id, salary_per_day || 0]
        );
        const newTeacher = result.rows[0];

        // 3. Create Login for Teacher
        let loginEmail = email || `${employee_id}@teacher.school.com`;
        const defaultPassword = await bcrypt.hash('123456', 10);

        let userCheck = await client.query('SELECT id FROM users WHERE email = $1', [loginEmail]);
        if (userCheck.rows.length > 0) {
            loginEmail = `${employee_id}@teacher.school.com`;
            userCheck = await client.query('SELECT id FROM users WHERE email = $1', [loginEmail]);
        }

        if (userCheck.rows.length === 0) {
            await client.query(
                `INSERT INTO users (email, password, role, school_id, must_change_password) VALUES ($1, $2, 'TEACHER', $3, TRUE)`,
                [loginEmail, defaultPassword, school_id]
            );
        }

        // 4. Assign as Class Teacher (if selected)
        if (assign_class_id && assign_section_id) {
            await client.query(
                `UPDATE sections SET class_teacher_id = $1 WHERE id = $2 AND class_id = $3`,
                [newTeacher.id, assign_section_id, assign_class_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(newTeacher);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error adding teacher' });
    } finally {
        client.release();
    }
};

// Get Teachers
exports.getTeachers = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        // Fetch teachers AND their assigned class if any
        const query = `
            SELECT t.*, 
                   c.name as class_name, 
                   s.name as section_name,
                   s.id as assigned_section_id,
                   c.id as assigned_class_id
            FROM teachers t
            LEFT JOIN sections s ON s.class_teacher_id = t.id
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE t.school_id = $1 
            ORDER BY t.name ASC
        `;
        const result = await pool.query(query, [school_id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching teachers' });
    }
};

// Update Teacher
exports.updateTeacher = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;
        const { name, email, phone, subject_specialization, gender, address, join_date, assign_class_id, assign_section_id, salary_per_day } = req.body;

        await client.query('BEGIN');

        // Check if phone number already exists for another teacher
        if (phone) {
            const phoneCheck = await client.query(
                'SELECT id, name FROM teachers WHERE phone = $1 AND school_id = $2 AND id != $3',
                [phone, school_id, id]
            );
            if (phoneCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: `Phone number already exists for teacher: ${phoneCheck.rows[0].name}`
                });
            }
        }

        // Check if email already exists for another teacher
        if (email) {
            const emailCheck = await client.query(
                'SELECT id, name FROM teachers WHERE email = $1 AND school_id = $2 AND id != $3',
                [email, school_id, id]
            );
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    message: `Email already exists for teacher: ${emailCheck.rows[0].name}`
                });
            }
        }

        const result = await client.query(
            `UPDATE teachers SET name = $1, email = $2, phone = $3, subject_specialization = $4, gender = $5, address = $6, join_date = $7, salary_per_day = $8
             WHERE id = $9 AND school_id = $10 RETURNING *`,
            [name, email, phone, subject_specialization, gender, address, join_date, salary_per_day || 0, id, school_id]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Handle Class Teacher Assignment Update
        // 1. Remove this teacher from any previous sections
        await client.query('UPDATE sections SET class_teacher_id = NULL WHERE class_teacher_id = $1', [id]);

        // 2. Assign to new section if provided
        if (assign_class_id && assign_section_id) {
            await client.query(
                `UPDATE sections SET class_teacher_id = $1 WHERE id = $2 AND class_id = $3`,
                [id, assign_section_id, assign_class_id]
            );
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error updating teacher' });
    } finally {
        client.release();
    }
};

// Delete Teacher
exports.deleteTeacher = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;
        const result = await pool.query(
            `DELETE FROM teachers WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, school_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Teacher not found' });
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting teacher' });
    }
};

// Mark Attendance
exports.markAttendance = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { date, attendanceData } = req.body; // [{ teacher_id, status }]

        await client.query('BEGIN');

        for (const record of attendanceData) {
            await client.query(
                `INSERT INTO teacher_attendance(school_id, teacher_id, date, status)
                VALUES($1, $2, $3, $4)
                ON CONFLICT(teacher_id, date) 
                DO UPDATE SET status = EXCLUDED.status`,
                [school_id, record.teacher_id, date, record.status]
            );
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

// Get Daily Attendance (Detailed)
exports.getDailyAttendance = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { date } = req.query;

        if (!date) return res.status(400).json({ message: 'Date is required' });

        const query = `
            SELECT t.id, t.name, t.phone, t.subject_specialization, COALESCE(a.status, 'Unmarked') as status
            FROM teachers t
            LEFT JOIN teacher_attendance a ON t.id = a.teacher_id AND a.date = $2
            WHERE t.school_id = $1
            ORDER BY t.name ASC
        `;
        const result = await pool.query(query, [school_id, date]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching daily attendance' });
    }
};

// Get Monthly Attendance Report
exports.getAttendanceReport = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { month, year } = req.query;

        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const query = `
            SELECT t.id as teacher_id, t.name, a.date, a.status
            FROM teachers t
            LEFT JOIN teacher_attendance a ON t.id = a.teacher_id AND a.date >= $2 AND a.date <= $3
            WHERE t.school_id = $1
        `;
        const result = await pool.query(query, [school_id, startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching attendance report' });
    }
};

// Get Subjects (Distinct List)
exports.getSubjects = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const result = await pool.query(`
            SELECT DISTINCT name 
            FROM subjects 
            WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)
            ORDER BY name ASC
        `, [school_id]);
        res.json(result.rows.map(r => r.name));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching subjects' });
    }
};

// Get Teacher Profile (Logged-in User)
exports.getTeacherProfile = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const email = req.user.email;

        // Find teacher by email and link to assigned class via sections table
        const query = `
            SELECT t.*, 
                   c.name as class_name, 
                   s.name as section_name,
                   s.id as assigned_section_id,
                   c.id as assigned_class_id,
                   tr.route_name as transport_route,
                   tv.vehicle_number,
                   tv.driver_name,
                   tv.driver_phone,
                   tv.current_lat,
                   tv.current_lng
            FROM teachers t
            LEFT JOIN sections s ON s.class_teacher_id = t.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN transport_routes tr ON t.transport_route_id = tr.id
            LEFT JOIN transport_vehicles tv ON tr.vehicle_id = tv.id
            WHERE t.school_id = $1 AND t.email = $2
        `;
        const result = await pool.query(query, [school_id, email]);

        if (result.rows.length === 0) {
            // If no teacher record found for this user email
            return res.status(404).json({ message: 'Teacher profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// Get My Attendance History (Logged-in User)
exports.getMyAttendanceHistory = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const email = req.user.email;
        const { month, year } = req.query;

        // Find teacher ID from email
        const tRes = await pool.query('SELECT id FROM teachers WHERE email = $1 AND school_id = $2', [email, school_id]);
        if (tRes.rows.length === 0) return res.status(404).json({ message: 'Teacher profile not found' });
        const teacher_id = tRes.rows[0].id;

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        // month is 1-based index (1=Jan, 12=Dec). 
        // new Date(year, month, 0) gives the last day of that month.
        // e.g. new Date(2024, 1, 0) -> Jan 31 2024. Wait.
        // Date constructor uses 0-based month index (0=Jan, 11=Dec).
        // If 'month' param is "1" (Jan), we want startDate "2024-01-01" to "2024-01-31".
        // new Date(2024, 1, 0) -> 2024, Month Index 1 (Feb), Day 0 -> Last day of Jan. Correct.
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const query = `
            SELECT date, status
            FROM teacher_attendance 
            WHERE teacher_id = $1 AND school_id = $2 AND date >= $3 AND date <= $4
            ORDER BY date ASC
        `;
        const result = await pool.query(query, [teacher_id, school_id, startDate, endDate]);

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching attendance history' });
    }
};
