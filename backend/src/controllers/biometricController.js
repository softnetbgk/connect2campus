const { pool } = require('../config/db');
const { sendAttendanceNotification } = require('../services/notificationService');

// Unified User Search
const searchUsers = async (req, res) => {
    try {
        const { type, query } = req.query; // type: 'student', 'teacher', 'staff'
        const schoolId = req.user.schoolId;

        let sql = '';
        let params = [schoolId, `%${query}%`];

        if (type === 'student') {
            sql = `SELECT id, name, admission_no as user_id, 'student' as type, biometric_template, rfid_card_id 
                   FROM students WHERE school_id = $1 AND (name ILIKE $2 OR admission_no ILIKE $2)`;
        } else if (type === 'teacher') {
            sql = `SELECT id, name, email as user_id, 'teacher' as type, biometric_template, rfid_card_id 
                   FROM teachers WHERE school_id = $1 AND (name ILIKE $2 OR email ILIKE $2)`;
        } else if (type === 'staff') {
            sql = `SELECT id, name, email as user_id, 'staff' as type, biometric_template, rfid_card_id 
                   FROM staff WHERE school_id = $1 AND (name ILIKE $2 OR email ILIKE $2)`;
        }

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error searching users' });
    }
};

// Update Biometric/Card Data
const updateCredentials = async (req, res) => {
    try {
        const { type, id } = req.body;
        const { biometric_template, rfid_card_id } = req.body;

        let table = '';
        if (type === 'student') table = 'students';
        else if (type === 'teacher') table = 'teachers';
        else if (type === 'staff') table = 'staff';
        else return res.status(400).json({ message: 'Invalid user type' });

        // Update query
        await pool.query(
            `UPDATE ${table} SET biometric_template = COALESCE($1, biometric_template), rfid_card_id = COALESCE($2, rfid_card_id) WHERE id = $3`,
            [biometric_template, rfid_card_id, id]
        );

        res.json({ message: 'Credentials updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating credentials' });
    }
};

// Mark Attendance via Device (Card/Fingerprint)
const markDeviceAttendance = async (req, res) => {
    const client = await pool.connect();
    try {
        const { input_id, mode } = req.body; // input_id: card number or student id. mode: 'card' or 'fingerprint' or 'id'
        const schoolId = req.user.schoolId;
        const date = new Date().toISOString().split('T')[0];

        let user = null;
        let table = '';
        let userType = '';

        // 1. Find User
        // Try Student
        const studentRes = await client.query(
            `SELECT * FROM students WHERE school_id = $1 AND (rfid_card_id = $2 OR admission_no = $2)`,
            [schoolId, input_id]
        );
        if (studentRes.rows.length > 0) {
            user = studentRes.rows[0];
            table = 'attendance';
            userType = 'student';
        }

        // Try Teacher (if not student)
        if (!user) {
            const teacherRes = await client.query(
                `SELECT * FROM teachers WHERE school_id = $1 AND (rfid_card_id = $2 OR email = $2)`,
                [schoolId, input_id]
            );
            if (teacherRes.rows.length > 0) {
                user = teacherRes.rows[0];
                table = 'teacher_attendance';
                userType = 'teacher';
            }
        }

        // Try Staff (if not teacher)
        if (!user) {
            const staffRes = await client.query(
                `SELECT * FROM staff WHERE school_id = $1 AND (rfid_card_id = $2 OR email = $2)`,
                [schoolId, input_id]
            );
            if (staffRes.rows.length > 0) {
                user = staffRes.rows[0];
                table = 'staff_attendance';
                userType = 'staff';
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Mark Attendance
        // Check if already marked
        const existingRef = await client.query(
            `SELECT * FROM ${table} WHERE ${userType}_id = $1 AND date = $2`,
            [user.id, date]
        );

        if (existingRef.rows.length > 0) {
            return res.json({ success: true, message: `Attendance already marked for ${user.name}`, user: user });
        }

        await client.query(
            `INSERT INTO ${table} (${userType}_id, date, status, school_id) VALUES ($1, $2, 'Present', $3)`,
            [user.id, date, schoolId]
        );

        // Send SMS for Students
        if (userType === 'student') {
            // Fetch full student details like contact_number which might not be in the lightweight user object if we tailored the query earlier
            // Actually, in searchUsers we selected specific fields, but in markDeviceAttendance we did "SELECT * FROM students".
            // "SELECT *" usually includes contact_number.
            await sendAttendanceNotification(user, 'Present');
        }

        res.json({ success: true, message: `Welcome, ${user.name}!`, user: user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error marking attendance' });
    } finally {
        client.release();
    }
};

// Handle Attendance Push from External Standalone Devices (ZKTeco/eSSL/IoT)
// Expected Payload: { device_id, user_id, timestamp, verification_mode }
const handleExternalDeviceLog = async (req, res) => {
    const client = await pool.connect();
    try {
        // Support both JSON body (Modern IoT) and Query Params (Legacy ADMS)
        const data = Object.keys(req.body).length > 0 ? req.body : req.query;

        console.log('[DEVICE RAW DATA]', data);

        // Map ADMS/Secureye fields to our internal fields
        // ADMS uses: PIN (User ID), SN (Device ID), Time (Log Time)
        const user_id = data.user_id || data.PIN || data.EnrollNumber;
        const device_id = data.device_id || data.SN;
        const timestamp = data.timestamp || data.Time;

        const schoolId = req.user?.schoolId || 1; // Default to 1 if device doesn't send school token

        console.log(`[DEVICE PUSH] Device: ${device_id} | User: ${user_id} | Time: ${timestamp}`);

        // If it's a handshake/heartbeat (often sends SN only), just return OK
        if (device_id && !user_id) {
            return res.send('OK');
        }

        if (!user_id) {
            console.warn('[DEVICE ERROR] Missing user_id/PIN in request');
            return res.status(400).send('Missing user_id');
        }

        // Logic similar to local markDeviceAttendance but simplified for external push
        const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        // 1. Find User (Student/Teacher/Staff)
        let user = null;
        let table = '';
        let userType = '';

        // Try Student (Match Admission No or Card ID)
        const studentRes = await client.query(
            `SELECT * FROM students WHERE school_id = $1 AND (admission_no = $2 OR rfid_card_id = $2)`,
            [schoolId, user_id]
        );
        if (studentRes.rows.length > 0) {
            user = studentRes.rows[0];
            table = 'attendance';
            userType = 'student';
        }

        // Try Teacher
        if (!user) {
            const teacherRes = await client.query(
                `SELECT * FROM teachers WHERE school_id = $1 AND (email = $2 OR rfid_card_id = $2)`,
                [schoolId, user_id]
            );
            if (teacherRes.rows.length > 0) {
                user = teacherRes.rows[0];
                table = 'teacher_attendance';
                userType = 'teacher';
            }
        }

        // Try Staff
        if (!user) {
            const staffRes = await client.query(
                `SELECT * FROM staff WHERE school_id = $1 AND (email = $2 OR rfid_card_id = $2)`,
                [schoolId, user_id]
            );
            if (staffRes.rows.length > 0) {
                user = staffRes.rows[0];
                table = 'staff_attendance';
                userType = 'staff';
            }
        }

        if (user) {
            // 2. Mark Attendance
            await client.query(
                `INSERT INTO ${table} (${userType}_id, date, status, school_id) VALUES ($1, $2, 'Present', $3)
                 ON CONFLICT (${userType}_id, date) DO NOTHING`,
                [user.id, date, schoolId]
            );

            // 3. Trigger SMS
            if (userType === 'student') {
                await sendAttendanceNotification(user, 'Present');
            }

            return res.send('OK'); // Standard ADMS success response
        }

        res.status(404).send('User not found');

    } catch (error) {
        console.error('Device Push Error:', error);
        res.status(500).send('Error');
    } finally {
        client.release();
    }
};

module.exports = { searchUsers, updateCredentials, markDeviceAttendance, handleExternalDeviceLog };
