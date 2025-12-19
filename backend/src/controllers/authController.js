const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const login = async (req, res) => {
    const { password, role } = req.body;
    let { email } = req.body; // Can be Email or ID (Admission No / Emp ID)

    if (email) email = email.trim();

    // Resolve Emails to checks (support ID login)
    let checkEmails = [email];
    const isEmail = email && email.includes('@');

    try {
        if (!isEmail && role) {
            // It's an ID. Resolve to possible emails.
            if (role === 'STUDENT') {
                checkEmails.push(`${email.toLowerCase()}@student.school.com`);
                const sRes = await pool.query('SELECT email FROM students WHERE admission_no ILIKE $1', [email]);
                if (sRes.rows.length > 0) checkEmails.push(sRes.rows[0].email);
            }
            else if (role === 'TEACHER') {
                checkEmails.push(`${email}@teacher.school.com`);
                const tRes = await pool.query('SELECT email FROM teachers WHERE employee_id = $1', [email]);
                if (tRes.rows.length > 0) checkEmails.push(tRes.rows[0].email);
            }
            else if (['STAFF', 'DRIVER', 'ACCOUNTANT'].includes(role)) { // Staff roles
                checkEmails.push(`${email}@staff.school.com`);
                const stRes = await pool.query('SELECT email FROM staff WHERE employee_id = $1', [email]);
                if (stRes.rows.length > 0) checkEmails.push(stRes.rows[0].email);
            }
        }

        // Find user by Email(s) AND Role (if provided)
        let query = `SELECT * FROM users WHERE email = ANY($1::text[])`;
        let params = [checkEmails];

        if (role) {
            if (role === 'STAFF') {
                query += ` AND role IN ('STAFF', 'DRIVER')`; // Allow both for Staff login
            } else {
                query += ` AND role = $2`;
                params.push(role);
            }
        }

        const result = await pool.query(query, params);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Role verification (Redundant due to SQL filter but good for safety/custom logic)
        if (role) {
            if (role === 'STAFF') {
                if (!['STAFF', 'DRIVER'].includes(user.role)) return res.status(403).json({ message: 'Access denied' });
            } else if (user.role !== role) {
                return res.status(403).json({ message: `Access denied. You are not a ${role}` });
            }
        }

        // Fetch Linked ID (Student/Teacher/Staff ID) to optimize downstream requests
        let linkedId = null;
        if (user.role === 'STUDENT') {
            // Try to find student by User Email first
            let sRes = await pool.query('SELECT id FROM students WHERE school_id = $1 AND email = $2', [user.school_id, user.email]);
            if (sRes.rows.length === 0) {
                // If not found (means User Email is synthetic), find by Admission No from synthetic email
                // Synthetic: adm123@student.school.com -> adm123
                const potentialAdmNo = user.email.split('@')[0];
                sRes = await pool.query('SELECT id FROM students WHERE school_id = $1 AND admission_no ILIKE $2', [user.school_id, potentialAdmNo]);
            }
            if (sRes.rows.length > 0) linkedId = sRes.rows[0].id;

        } else if (user.role === 'TEACHER') {
            let tRes = await pool.query('SELECT id FROM teachers WHERE school_id = $1 AND email = $2', [user.school_id, user.email]);
            if (tRes.rows.length === 0) {
                const potentialEmpId = user.email.split('@')[0];
                tRes = await pool.query('SELECT id FROM teachers WHERE school_id = $1 AND employee_id = $2', [user.school_id, potentialEmpId]);
            }
            if (tRes.rows.length > 0) linkedId = tRes.rows[0].id;

        } else if (['STAFF', 'DRIVER', 'ACCOUNTANT', 'LIBRARIAN'].includes(user.role)) {
            let stRes = await pool.query('SELECT id FROM staff WHERE school_id = $1 AND email = $2', [user.school_id, user.email]);
            if (stRes.rows.length === 0) {
                const potentialEmpId = user.email.split('@')[0];
                stRes = await pool.query('SELECT id FROM staff WHERE school_id = $1 AND employee_id = $2', [user.school_id, potentialEmpId]);
            }
            if (stRes.rows.length > 0) linkedId = stRes.rows[0].id;
        }

        // Generate Token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                schoolId: user.school_id,
                linkedId: linkedId // Embedded ID for fast access
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update user with new session token
        await pool.query('UPDATE users SET current_session_token = $1 WHERE id = $2', [token, user.id]);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                schoolId: user.school_id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const logout = async (req, res) => {
    try {
        await pool.query('UPDATE users SET current_session_token = NULL WHERE id = $1', [req.user.id]);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};

const setupSuperAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if Super Admin already exists
        const check = await pool.query("SELECT * FROM users WHERE role = 'SUPER_ADMIN'");
        if (check.rows.length > 0) {
            return res.status(400).json({ message: 'Super Admin already exists. Cannot create another one via this public route.' });
        }

        // 2. Create Password Hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert User
        const newUser = await pool.query(
            `INSERT INTO users (email, password, role, school_id) 
             VALUES ($1, $2, 'SUPER_ADMIN', NULL) 
             RETURNING id, email, role`,
            [email, hashedPassword]
        );

        res.json({ message: 'Super Admin created successfully!', user: newUser.rows[0] });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ message: 'Server error during setup: ' + error.message });
    }
};


const forgotPassword = async (req, res) => {
    let { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ message: 'Email and Role are required' });

    email = email.trim();

    try {
        // Resolve logic to find the specific user similar to login (Unified ID/Email resolution)
        let checkEmails = [email];
        const isEmail = email.includes('@');

        if (!isEmail && role) {
            if (role === 'STUDENT') {
                checkEmails.push(`${email.toLowerCase()}@student.school.com`);
                const sRes = await pool.query('SELECT email FROM students WHERE admission_no ILIKE $1', [email]);
                if (sRes.rows.length > 0) checkEmails.push(sRes.rows[0].email);
            }
            else if (role === 'TEACHER') {
                checkEmails.push(`${email}@teacher.school.com`);
                const tRes = await pool.query('SELECT email FROM teachers WHERE employee_id = $1', [email]);
                if (tRes.rows.length > 0) checkEmails.push(tRes.rows[0].email);
            }
            else if (['STAFF', 'DRIVER', 'ACCOUNTANT'].includes(role)) {
                checkEmails.push(`${email}@staff.school.com`);
                const stRes = await pool.query('SELECT email FROM staff WHERE employee_id = $1', [email]);
                if (stRes.rows.length > 0) checkEmails.push(stRes.rows[0].email);
            }
        }

        // Find user
        let query = `SELECT * FROM users WHERE email = ANY($1::text[])`;
        let params = [checkEmails];

        if (role === 'STAFF') {
            query += ` AND role IN ('STAFF', 'DRIVER')`;
        } else {
            query += ` AND role = $2`;
            params.push(role);
        }

        const result = await pool.query(query, params);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate Token
        // Using crypto (built-in node)
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = Date.now() + 3600000; // 1 hour

        await pool.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [resetToken, resetExpires, user.id]);

        // Send Email
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        // Log for development (always visible)
        console.log('----- PASSWORD RESET LINK (Dev Mode) -----');
        console.log(`Role: ${role}, Email: ${email}`);
        console.log(`Link: ${resetLink}`);
        console.log('----------------------------------------');

        // Attempt to send Real Email if configured
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail', // or use host/port for others
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email, // This must be a REAL email address to work
                    subject: 'Password Reset Request - School Portal',
                    html: `
                        <h3>Password Reset Request</h3>
                        <p>You requested a password reset for your <strong>${role}</strong> account.</p>
                        <p>Click the link below to verify your identity and set a new password:</p>
                        <a href="${resetLink}">${resetLink}</a>
                        <p>This link expires in 1 hour.</p>
                        <p>If you did not request this, please ignore this email.</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log('Email sent successfully to ' + email);
            } catch (emailErr) {
                console.error('Failed to send real email (Check .env credentials):', emailErr.message);
                // Don't fail the request, just let the user know to check console/admin
            }
        } else {
            console.log('NOTE: Real email sending skipped. Add EMAIL_USER and EMAIL_PASS to .env to enable.');
        }

        res.json({ message: 'Password reset link generated. Check your email (or server console for dev).' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        // Find user with valid token and expiry (expiry > now)
        // PostgreSQL BIGINT stores as string in JS sometimes if too big, but Date.now() fits in generic numeric or we just look greater.
        // Assuming column is BIGINT.

        const result = await pool.query('SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2', [token, Date.now()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2', [hashedPassword, user.id]);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { login, setupSuperAdmin, logout, forgotPassword, resetPassword };
