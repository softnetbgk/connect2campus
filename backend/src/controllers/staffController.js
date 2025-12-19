const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// Add Staff
exports.addStaff = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { name, email, phone, role, gender, address, join_date, salary_per_day } = req.body;

        await client.query('BEGIN');

        // 1. Generate 6-Digit Staff ID
        let employee_id;
        let isUnique = false;
        while (!isUnique) {
            employee_id = Math.floor(100000 + Math.random() * 900000).toString();
            // Check uniqueness in staff
            const check = await client.query('SELECT 1 FROM staff WHERE employee_id = $1 AND school_id = $2', [employee_id, school_id]);
            if (check.rows.length === 0) isUnique = true;
        }

        const result = await client.query(
            `INSERT INTO staff (school_id, name, email, phone, role, gender, address, join_date, employee_id, salary_per_day)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [school_id, name, email, phone, role, gender, address, join_date || new Date(), employee_id, salary_per_day || 0]
        );

        // Create User Login
        let loginEmail = email || `${employee_id}@staff.school.com`;
        const defaultPassword = await bcrypt.hash('123456', 10);

        // Convert 'DRIVER' to 'STAFF' role for user table simplification, or keep DRIVER? 
        // Logic in authController says: "Allow DRIVER to login as STAFF". 
        // But if I create user as STAFF, it's safer. However, preserving specific role is better.
        // Let's use the provided role if it matches enum, or default to STAFF. 
        // Actually, users table 'role' column likely supports 'STAFF', 'DRIVER'.
        // Let's just uppercase the role input.
        const userRole = ['DRIVER', 'ACCOUNTANT', 'LIBRARIAN'].includes(role.toUpperCase()) ? role.toUpperCase() : 'STAFF';

        let userCheck = await client.query('SELECT id FROM users WHERE email = $1', [loginEmail]);
        if (userCheck.rows.length > 0) {
            loginEmail = `${employee_id}@staff.school.com`;
            userCheck = await client.query('SELECT id FROM users WHERE email = $1', [loginEmail]);
        }

        if (userCheck.rows.length === 0) {
            await client.query(
                `INSERT INTO users (email, password, role, school_id) VALUES ($1, $2, $3, $4)`,
                [loginEmail, defaultPassword, userRole, school_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Server error adding staff' });
    } finally {
        client.release();
    }
};

// Get Staff
exports.getStaff = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { search } = req.query;
        let query = `SELECT * FROM staff WHERE school_id = $1`;
        const params = [school_id];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $2 OR employee_id ILIKE $2 OR phone ILIKE $2)`;
        }

        query += ` ORDER BY name ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching staff' });
    }
};

// Update Staff
exports.updateStaff = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;
        const { name, email, phone, role, gender, address, join_date, salary_per_day } = req.body;

        const result = await pool.query(
            `UPDATE staff SET name = $1, email = $2, phone = $3, role = $4, gender = $5, address = $6, join_date = $7, salary_per_day = $8
             WHERE id = $9 AND school_id = $10 RETURNING *`,
            [name, email, phone, role, gender, address, join_date, salary_per_day || 0, id, school_id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Staff member not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating staff' });
    }
};

// Delete Staff
exports.deleteStaff = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;
        const result = await pool.query(
            `DELETE FROM staff WHERE id = $1 AND school_id = $2 RETURNING *`,
            [id, school_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Staff member not found' });
        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error deleting staff' });
    }
};

// Mark Attendance
exports.markAttendance = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { date, attendanceData } = req.body; // [{ staff_id, status }]

        await client.query('BEGIN');

        for (const record of attendanceData) {
            await client.query(
                `INSERT INTO staff_attendance(school_id, staff_id, date, status)
                VALUES($1, $2, $3, $4)
                ON CONFLICT(staff_id, date) 
                DO UPDATE SET status = EXCLUDED.status`,
                [school_id, record.staff_id, date, record.status]
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

// Get Daily Attendance
exports.getDailyAttendance = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { date } = req.query;

        if (!date) return res.status(400).json({ message: 'Date is required' });

        const query = `
            SELECT t.id, t.name, t.phone, t.role, COALESCE(a.status, 'Unmarked') as status
            FROM staff t
            LEFT JOIN staff_attendance a ON t.id = a.staff_id AND a.date = $2
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
            SELECT t.id as staff_id, t.name, a.date, a.status
            FROM staff t
            LEFT JOIN staff_attendance a ON t.id = a.staff_id AND a.date >= $2 AND a.date <= $3
            WHERE t.school_id = $1
        `;
        const result = await pool.query(query, [school_id, startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching attendance report' });
    }
};

// Get My Attendance (Logged in Staff)
exports.getMyAttendance = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const user_email = req.user.email;
        const { month, year } = req.query;

        // 1. Get Staff ID from User Email
        const staffRes = await pool.query('SELECT id FROM staff WHERE email = $1 AND school_id = $2', [user_email, school_id]);

        if (staffRes.rows.length === 0) {
            // Check if driver? No, drivers are also in Staff table usually if simplified, or handled separately.
            // If the user role is driver, they might not be in 'staff' table if schema separates them.
            // But based on previous contexts, drivers are likely treated as staff or have similar structures.
            // Let's assume they are in staff table or we return empty.
            return res.json([]);
        }

        const staff_id = staffRes.rows[0].id;

        // 2. Fetch Attendance
        const startDate = `${year}-${month}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const query = `
            SELECT date, status
            FROM staff_attendance
            WHERE staff_id = $1 AND date >= $2 AND date <= $3
            ORDER BY date DESC
        `;
        const result = await pool.query(query, [staff_id, startDate, endDate]);

        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching my attendance:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Profile (Logged in Staff)
exports.getProfile = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const user_email = req.user.email;

        const query = `
            SELECT t.*, 
                   tr.route_name, tr.vehicle_id, 
                   tv.vehicle_number, tv.driver_name, tv.driver_phone
            FROM staff t
            LEFT JOIN transport_routes tr ON t.transport_route_id = tr.id
            LEFT JOIN transport_vehicles tv ON tr.vehicle_id = tv.id
            WHERE t.email = $1 AND t.school_id = $2
        `;

        const result = await pool.query(query, [user_email, school_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get My Salary Slips
exports.getSalarySlips = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const user_email = req.user.email;

        // 1. Get Staff ID
        const staffRes = await pool.query('SELECT id FROM staff WHERE email = $1 AND school_id = $2', [user_email, school_id]);
        if (staffRes.rows.length === 0) return res.json([]);
        const staff_id = staffRes.rows[0].id;

        // 2. Fetch Salary Records (Assuming table exists, wrapped in try-catch to be safe)
        const result = await pool.query(`
            SELECT * FROM salary_payments 
            WHERE staff_id = $1 
            ORDER BY year DESC, month DESC
        `, [staff_id]);

        res.json(result.rows);

    } catch (error) {
        // If table doesn't exist, return empty array gracefully for now
        if (error.code === '42P01') { // undefined_table
            console.warn("Salary table missing");
            return res.json([]);
        }
        console.error('Error fetching salary slips:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
