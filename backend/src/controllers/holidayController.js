const { pool } = require('../config/db');
const { generateAnnualCalendar } = require('../utils/holidayUtils');

// Helper to format Date object to YYYY-MM-DD string without timezone shifts
const formatDateLocal = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get all holidays for a school
exports.getHolidays = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { year } = req.query;

        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS school_holidays (
                id SERIAL PRIMARY KEY,
                school_id INTEGER NOT NULL,
                holiday_date DATE NOT NULL,
                holiday_name VARCHAR(255) NOT NULL,
                is_paid BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(school_id, holiday_date)
            );
        `);

        let query = `
            SELECT * FROM school_holidays 
            WHERE school_id = $1
        `;
        const params = [school_id];

        if (year) {
            query += ` AND EXTRACT(YEAR FROM holiday_date) = $2`;
            params.push(year);
        }

        query += ` ORDER BY holiday_date ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ message: 'Server error fetching holidays', error: error.message });
    }
};

// Add a new holiday
exports.addHoliday = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { holiday_date, holiday_name, is_paid = true } = req.body;

        if (!holiday_date || !holiday_name) {
            return res.status(400).json({ message: 'Holiday date and name are required' });
        }

        await client.query('BEGIN');

        // 1. Add to school_holidays
        const result = await client.query(
            `INSERT INTO school_holidays (school_id, holiday_date, holiday_name, is_paid)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [school_id, holiday_date, holiday_name, is_paid]
        );

        // 2. Add to events table for Calendar display
        await client.query(
            `INSERT INTO events (school_id, title, event_type, start_date, end_date, description, audience)
             VALUES ($1, $2, 'Holiday', $3, $3, $4, 'All')`,
            [school_id, holiday_name, holiday_date, is_paid ? 'Paid Holiday' : 'Holiday']
        );

        // 3. Automatically mark attendance as Holiday for everyone (if not Sunday)
        const dayOfWeek = await client.query(`SELECT EXTRACT(DOW FROM $1::date) as dow`, [holiday_date]);
        const isSunday = dayOfWeek.rows[0].dow == 0;

        if (!isSunday) {
            // Get all teachers, staff, and students
            const teachers = await client.query('SELECT id FROM teachers WHERE school_id = $1', [school_id]);
            const staff = await client.query('SELECT id FROM staff WHERE school_id = $1', [school_id]);
            const students = await client.query('SELECT id FROM students WHERE school_id = $1 AND (status IS NULL OR status != \'Deleted\')', [school_id]);

            // Mark teachers
            if (teachers.rows.length > 0) {
                const teacherIds = teachers.rows.map(r => r.id);
                await client.query(`
                    INSERT INTO teacher_attendance (school_id, teacher_id, date, status)
                    SELECT $1, t_id, $2::date, 'Holiday'
                    FROM unnest($3::int[]) as t_id
                    ON CONFLICT (teacher_id, date) DO UPDATE SET status = 'Holiday'
                `, [school_id, holiday_date, teacherIds]);
            }

            // Mark staff
            if (staff.rows.length > 0) {
                const staffIds = staff.rows.map(r => r.id);
                await client.query(`
                    INSERT INTO staff_attendance (school_id, staff_id, date, status)
                    SELECT $1, s_id, $2::date, 'Holiday'
                    FROM unnest($3::int[]) as s_id
                    ON CONFLICT (staff_id, date) DO UPDATE SET status = 'Holiday'
                `, [school_id, holiday_date, staffIds]);
            }

            // Mark students
            if (students.rows.length > 0) {
                const studentIds = students.rows.map(r => r.id);
                await client.query(`
                    INSERT INTO attendance (school_id, student_id, date, status)
                    SELECT $1, st_id, $2::date, 'Holiday'
                    FROM unnest($3::int[]) as st_id
                    ON CONFLICT (student_id, date) DO UPDATE SET status = 'Holiday'
                `, [school_id, holiday_date, studentIds]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ message: 'Holiday already exists for this date' });
        }
        console.error('Error adding holiday:', error);
        res.status(500).json({ message: 'Server error adding holiday' });
    } finally {
        client.release();
    }
};

// Update a holiday
exports.updateHoliday = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const school_id = req.user.schoolId;
        const { holiday_date, holiday_name, is_paid } = req.body;

        await client.query('BEGIN');

        // Get old date to find corresponding event
        const oldRes = await client.query('SELECT holiday_date FROM school_holidays WHERE id = $1 AND school_id = $2', [id, school_id]);
        if (oldRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Holiday not found' });
        }
        const oldDate = oldRes.rows[0].holiday_date;

        // 1. Update school_holidays
        const result = await client.query(
            `UPDATE school_holidays 
             SET holiday_date = $1, holiday_name = $2, is_paid = $3
             WHERE id = $4 AND school_id = $5
             RETURNING *`,
            [holiday_date, holiday_name, is_paid, id, school_id]
        );

        // 2. Update events table
        await client.query(
            `UPDATE events 
             SET title = $1, start_date = $2, end_date = $2, description = $3
             WHERE school_id = $4 AND event_type = 'Holiday' AND start_date = $5`,
            [holiday_name, holiday_date, is_paid ? 'Paid Holiday' : 'Holiday', school_id, oldDate]
        );

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating holiday:', error);
        res.status(500).json({ message: 'Server error updating holiday' });
    } finally {
        client.release();
    }
};

// Delete a holiday
exports.deleteHoliday = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const school_id = req.user.schoolId;

        await client.query('BEGIN');

        // Get date to find corresponding event
        const oldRes = await client.query('SELECT holiday_date FROM school_holidays WHERE id = $1 AND school_id = $2', [id, school_id]);
        if (oldRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Holiday not found' });
        }
        const oldDate = oldRes.rows[0].holiday_date;

        // 1. Delete from school_holidays
        await client.query('DELETE FROM school_holidays WHERE id = $1 AND school_id = $2', [id, school_id]);

        // 2. Delete from events table
        await client.query(
            `DELETE FROM events 
             WHERE school_id = $1 AND event_type = 'Holiday' AND start_date = $2`,
            [school_id, oldDate]
        );

        await client.query('COMMIT');
        res.json({ message: 'Holiday deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting holiday:', error);
        res.status(500).json({ message: 'Server error deleting holiday' });
    } finally {
        client.release();
    }
};

// Auto-mark Sundays and Holidays (ULTRA FAST BULK IMPLEMENTATION)
exports.autoMarkHolidays = async (req, res) => {
    console.log('🔵 Auto-mark holidays request received');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const client = await pool.connect();
    try {
        let school_id = req.user.schoolId;
        const { month, year } = req.body; // month can be numeric or 'all'

        console.log(`Processing: month=${month}, year=${year}, school_id=${school_id}`);

        if (!year) {
            return res.status(400).json({ message: 'Year is required' });
        }

        // Fallback: If schoolId missing in token, fetch from DB
        if (!school_id) {
            const userRes = await client.query('SELECT school_id FROM users WHERE id = $1', [req.user.id]);
            if (userRes.rows.length > 0) school_id = userRes.rows[0].school_id;
        }
        if (!school_id) return res.status(400).json({ message: 'School ID not found' });

        await client.query('BEGIN');

        // Ensure tables exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS teacher_attendance (
                id SERIAL PRIMARY KEY,
                school_id INTEGER NOT NULL,
                teacher_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(teacher_id, date)
            );
            CREATE TABLE IF NOT EXISTS staff_attendance (
                id SERIAL PRIMARY KEY,
                school_id INTEGER NOT NULL,
                staff_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(staff_id, date)
            );
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                school_id INTEGER NOT NULL,
                student_id INTEGER NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(student_id, date)
            );
        `);

        // Get all teachers, staff, and students
        const teachers = await client.query('SELECT id FROM teachers WHERE school_id = $1', [school_id]);
        const staff = await client.query('SELECT id FROM staff WHERE school_id = $1', [school_id]);
        const students = await client.query('SELECT id FROM students WHERE school_id = $1 AND (status IS NULL OR status != \'Deleted\')', [school_id]);

        if (teachers.rows.length === 0 && staff.rows.length === 0 && students.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No individuals found for this school' });
        }

        const monthsToProcess = (month === 'all') ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [parseInt(month)];
        let totalDaysMarked = 0;

        for (const m of monthsToProcess) {
            const daysInMonth = new Date(year, m, 0).getDate();
            const startStr = `${year}-${String(m).padStart(2, '0')}-01`;
            const endStr = `${year}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

            // Fetch Holidays as STRINGS to avoid timezone shifts
            const holidays = await client.query(
                `SELECT TO_CHAR(holiday_date, 'YYYY-MM-DD') as hdate FROM school_holidays 
                 WHERE school_id = $1 AND holiday_date >= $2 AND holiday_date <= $3`,
                [school_id, startStr, endStr]
            );
            const holidayDates = holidays.rows.map(h => h.hdate);

            // 1. CLEANUP: Delete ALL 'Holiday' statuses for this month range first.
            // This clears any "H" that shouldn't be there.
            await client.query(`DELETE FROM teacher_attendance WHERE school_id = $1 AND date >= $2 AND date <= $3 AND status = 'Holiday'`, [school_id, startStr, endStr]);
            await client.query(`DELETE FROM staff_attendance WHERE school_id = $1 AND date >= $2 AND date <= $3 AND status = 'Holiday'`, [school_id, startStr, endStr]);
            await client.query(`DELETE FROM attendance WHERE school_id = $1 AND date >= $2 AND date <= $3 AND status = 'Holiday'`, [school_id, startStr, endStr]);

            if (holidayDates.length === 0) continue;

            const teacherIds = teachers.rows.map(r => r.id);
            const staffIds = staff.rows.map(r => r.id);
            const studentIds = students.rows.map(r => r.id);

            // 2. APPLY markers in bulk using CROSS JOIN unnest
            // This is the fastest way: one query per month for all individuals!
            if (teacherIds.length > 0) {
                await client.query(`
                    INSERT INTO teacher_attendance (school_id, teacher_id, date, status)
                    SELECT $1, t_id, d_date::date, 'Holiday'
                    FROM unnest($2::int[]) as t_id
                    CROSS JOIN unnest($3::text[]) as d_date
                    ON CONFLICT (teacher_id, date) DO UPDATE SET status = 'Holiday'
                `, [school_id, teacherIds, holidayDates]);
            }

            if (staffIds.length > 0) {
                await client.query(`
                    INSERT INTO staff_attendance (school_id, staff_id, date, status)
                    SELECT $1, s_id, d_date::date, 'Holiday'
                    FROM unnest($2::int[]) as s_id
                    CROSS JOIN unnest($3::text[]) as d_date
                    ON CONFLICT (staff_id, date) DO UPDATE SET status = 'Holiday'
                `, [school_id, staffIds, holidayDates]);
            }

            if (studentIds.length > 0) {
                // For students, we still chunk to avoid massive arrays, but larger chunks are fine
                const chunkSize = 5000;
                for (let i = 0; i < studentIds.length; i += chunkSize) {
                    const chunk = studentIds.slice(i, i + chunkSize);
                    await client.query(`
                        INSERT INTO attendance (school_id, student_id, date, status)
                        SELECT $1, st_id, d_date::date, 'Holiday'
                        FROM unnest($2::int[]) as st_id
                        CROSS JOIN unnest($3::text[]) as d_date
                        ON CONFLICT (student_id, date) DO UPDATE SET status = 'Holiday'
                    `, [school_id, chunk, holidayDates]);
                }
            }
            totalDaysMarked += holidayDates.length;
        }

        await client.query('COMMIT');
        res.json({
            message: 'Holidays marked successfully!',
            details: `Marked holidays for ${totalDaysMarked} days for Students, Staff, and Teachers.`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Auto-mark error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Failed to auto-mark holidays',
            error: error.message,
            details: error.stack
        });
    } finally {
        client.release();
    }
};

// Sync holidays from school calendar (ULTRA FAST BULK IMPLEMENTATION)
exports.syncFromCalendar = async (req, res) => {
    const client = await pool.connect();
    try {
        let school_id = req.user.schoolId;
        const { year } = req.body;

        if (!school_id) {
            const userRes = await client.query('SELECT school_id FROM users WHERE id = $1', [req.user.id]);
            if (userRes.rows.length > 0) school_id = userRes.rows[0].school_id;
        }
        if (!school_id) { client.release(); return res.status(400).json({ message: 'School ID not found' }); }
        if (!year) { client.release(); return res.status(400).json({ message: 'Year is required' }); }

        await client.query('BEGIN');

        // 1. Get Calendar Events
        const events = await client.query(
            `SELECT title, start_date FROM events WHERE school_id = $1 AND event_type = 'Holiday'`,
            [school_id]
        );

        const toInsertRaw = events.rows
            .filter(e => new Date(e.start_date).getFullYear() === parseInt(year))
            .map(e => ({ date: formatDateLocal(e.start_date), title: e.title }));

        // Deduplicate by date to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
        const uniqueHolidays = [];
        const seenDates = new Set();
        for (const h of toInsertRaw) {
            if (!seenDates.has(h.date)) {
                uniqueHolidays.push(h);
                seenDates.add(h.date);
            }
        }

        if (uniqueHolidays.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.json({ message: 'No holidays found in calendar.' });
        }

        // 2. Wipe existing holidays for this year
        await client.query(
            `DELETE FROM school_holidays WHERE school_id = $1 AND holiday_date >= $2 AND holiday_date <= $3`,
            [school_id, `${year}-01-01`, `${year}-12-31`]
        );

        // 3. Bulk Insert
        const placeholders = [];
        const values = [];
        uniqueHolidays.forEach((h, i) => {
            const b = i * 3;
            placeholders.push(`($${b + 1}, $${b + 2}, $${b + 3}, true)`);
            values.push(school_id, h.date, h.title);
        });

        await client.query(`
            INSERT INTO school_holidays (school_id, holiday_date, holiday_name, is_paid)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (school_id, holiday_date) DO UPDATE SET holiday_name = EXCLUDED.holiday_name
        `, values);

        await client.query('COMMIT');
        res.json({ message: 'Sync Successful', details: `Synced ${uniqueHolidays.length} holidays.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sync error:', error);
        res.status(500).json({ message: 'Server error during sync', error: error.message });
    } finally {
        client.release();
    }
};

// Broadcast Official Holiday to ALL Schools (Super Admin Only)
exports.broadcastOfficialHoliday = async (req, res) => {
    const client = await pool.connect();
    try {
        // Enforce Super Admin Role
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied. Super Admin only.' });
        }

        const { holiday_date, holiday_name } = req.body;

        if (!holiday_date || !holiday_name) {
            return res.status(400).json({ message: 'Holiday date and name are required' });
        }

        await client.query('BEGIN');

        console.log(`[BROADCAST HOLIDAY] Broadcasting "${holiday_name}" on ${holiday_date} to all schools...`);

        // 1. Insert into school_holidays for ALL schools
        // We use ON CONFLICT DO UPDATE to ensure we don't fail if it already exists
        const holidayResult = await client.query(`
            INSERT INTO school_holidays (school_id, holiday_date, holiday_name, is_paid)
            SELECT id, $1, $2, true
            FROM schools
            WHERE status != 'Deleted'
            ON CONFLICT (school_id, holiday_date) 
            DO UPDATE SET holiday_name = EXCLUDED.holiday_name, is_paid = true
            RETURNING school_id
        `, [holiday_date, holiday_name]);

        // 2. Insert/Update events table for ALL schools
        await client.query(`
            DELETE FROM events 
            WHERE event_type = 'Holiday' 
            AND start_date = $1 
            AND school_id IN (SELECT id FROM schools WHERE status != 'Deleted')
        `, [holiday_date]);

        await client.query(`
            INSERT INTO events (school_id, title, event_type, start_date, end_date, description, audience)
            SELECT id, $2, 'Holiday', $1, $1, 'Official Holiday', 'All'
            FROM schools
            WHERE status != 'Deleted'
        `, [holiday_date, holiday_name]);

        await client.query('COMMIT');

        const count = holidayResult.rowCount;
        console.log(`[BROADCAST HOLIDAY] Successfully added to ${count} schools.`);

        res.json({
            message: `Official holiday broadcasted successfully to ${count} schools.`,
            schoolsAffected: count
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error broadcasting holiday:', error);
        res.status(500).json({ message: 'Server error broadcasting holiday', error: error.message });
    } finally {
        client.release();
    }
};

// Broadcast BULK Official Holidays (Super Admin) - For Specific Year
exports.broadcastBulkHolidays = async (req, res) => {
    const client = await pool.connect();
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied. Super Admin only.' });
        }

        const { year } = req.body;
        const targetYear = year || new Date().getFullYear();

        // Generate Holidays on Backend
        const holidays = generateAnnualCalendar(targetYear);

        await client.query('BEGIN');

        console.log(`[BULK BROADCAST] Broadcasting ${holidays.length} holidays for ${targetYear} to ALL schools...`);

        // Get all active schools
        const schoolsRes = await client.query(`SELECT id FROM schools WHERE status != 'Deleted'`);
        const schoolIds = schoolsRes.rows.map(s => s.id);

        if (schoolIds.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No active schools found.' });
        }

        for (const holiday of holidays) {
            const { holiday_name, holiday_date } = holiday; // Matches utility output

            // A. Insert/Update school_holidays
            await client.query(`
                INSERT INTO school_holidays (school_id, holiday_date, holiday_name, is_paid)
                SELECT id, $1, $2, true
                FROM schools
                WHERE status != 'Deleted'
                ON CONFLICT (school_id, holiday_date) 
                DO UPDATE SET holiday_name = EXCLUDED.holiday_name
             `, [holiday_date, holiday_name]);

            // B. Update Events
            await client.query(`
                DELETE FROM events 
                WHERE event_type = 'Holiday' 
                AND start_date = $1 
                AND school_id IN (SELECT id FROM schools WHERE status != 'Deleted')
            `, [holiday_date]);

            await client.query(`
                INSERT INTO events (school_id, title, event_type, start_date, end_date, description, audience)
                SELECT id, $2, 'Holiday', $1, $1, 'Official Holiday', 'All'
                FROM schools
                WHERE status != 'Deleted'
            `, [holiday_date, holiday_name]);
        }

        await client.query('COMMIT');

        res.json({
            message: `Successfully broadcasted ${holidays.length} official holidays (Year ${targetYear}) to ${schoolIds.length} schools.`,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error broadcasting bulk holidays:', error);
        res.status(500).json({ message: 'Server error broadcasting holidays', error: error.message });
    } finally {
        client.release();
    }
};


// Get Holidays for specific school (Super Admin)
exports.getSchoolHolidaysAdmin = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { year } = req.query;

        let query = `SELECT * FROM school_holidays WHERE school_id = $1`;
        const params = [schoolId];

        if (year) {
            query += ` AND EXTRACT(YEAR FROM holiday_date) = $2`;
            params.push(year);
        }

        query += ` ORDER BY holiday_date ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching school holidays (admin):', error);
        res.status(500).json({ message: 'Error fetching holidays', error: error.message });
    }
};

// Sync Holidays from One School to All Schools (Super Admin)
exports.syncHolidaysFromSchool = async (req, res) => {
    const client = await pool.connect();
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied. Super Admin only.' });
        }

        const { sourceSchoolId, year, selectedDates } = req.body; // selectedDates is Array of "YYYY-MM-DD"

        if (!sourceSchoolId) {
            return res.status(400).json({ message: 'Source School ID is required' });
        }

        await client.query('BEGIN');

        console.log(`[SYNC HOLIDAYS] Syncing from School ${sourceSchoolId} to ALL schools...`);

        // 1. Fetch Source Holidays
        let query = `SELECT holiday_date, holiday_name FROM school_holidays WHERE school_id = $1`;
        const params = [sourceSchoolId];
        let paramIdx = 2; // $1 is school_id

        if (year) {
            query += ` AND EXTRACT(YEAR FROM holiday_date) = $${paramIdx}`;
            params.push(year);
            paramIdx++;
        }

        // Filter by selected dates if provided in body
        if (selectedDates && Array.isArray(selectedDates) && selectedDates.length > 0) {
            query += ` AND TO_CHAR(holiday_date, 'YYYY-MM-DD') = ANY($${paramIdx})`;
            params.push(selectedDates);
        }

        const holidaysRes = await client.query(query, params);
        const holidaysToSync = holidaysRes.rows;

        if (holidaysToSync.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'No matching holidays found to sync.' });
        }

        console.log(`[SYNC HOLIDAYS] Found ${holidaysToSync.length} holidays to sync.`);

        // 2. Sync to All Active Schools (Excluding Source)
        const targetSchoolsRes = await client.query(`SELECT id FROM schools WHERE id != $1 AND status != 'Deleted'`, [sourceSchoolId]);
        const targetSchoolIds = targetSchoolsRes.rows.map(s => s.id);

        if (targetSchoolIds.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'No other active schools found to sync to.' });
        }

        for (const holiday of holidaysToSync) {
            const { holiday_date, holiday_name } = holiday;

            // Format date string for SQL
            const dateStr = formatDateLocal(holiday_date);

            // A. Insert/Update school_holidays for all target schools
            await client.query(`
                INSERT INTO school_holidays (school_id, holiday_date, holiday_name, is_paid)
                SELECT id, $1, $2, true
                FROM schools
                WHERE id != $3 AND status != 'Deleted'
                ON CONFLICT (school_id, holiday_date) 
                DO UPDATE SET holiday_name = EXCLUDED.holiday_name
            `, [dateStr, holiday_name, sourceSchoolId]);

            // B. Update Events Table (Delete then Insert)
            // Delete existing 'Holiday' event on this date for target schools
            await client.query(`
                DELETE FROM events 
                WHERE event_type = 'Holiday' 
                AND start_date = $1 
                AND school_id IN (SELECT id FROM schools WHERE id != $2 AND status != 'Deleted')
            `, [dateStr, sourceSchoolId]);

            // Insert new event
            await client.query(`
                INSERT INTO events (school_id, title, event_type, start_date, end_date, description, audience)
                SELECT id, $2, 'Holiday', $1, $1, 'Official Holiday', 'All'
                FROM schools
                WHERE id != $3 AND status != 'Deleted'
            `, [dateStr, holiday_name, sourceSchoolId]);
        }

        await client.query('COMMIT');
        console.log(`[SYNC HOLIDAYS] Successfully synced ${holidaysToSync.length} holidays to ${targetSchoolIds.length} schools.`);

        res.json({
            message: `Successfully synced ${holidaysToSync.length} holidays to ${targetSchoolIds.length} schools.`,
            holidaysCount: holidaysToSync.length,
            schoolsCount: targetSchoolIds.length
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error syncing holidays:', error);
        res.status(500).json({ message: 'Server error syncing holidays', error: error.message });
    } finally {
        client.release();
    }
};

// Fix Schema (Temporary Tool)
exports.fixSchema = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Remove duplicates
        await client.query(`
            DELETE FROM school_holidays a 
            USING school_holidays b 
            WHERE a.ctid < b.ctid 
            AND a.school_id = b.school_id 
            AND a.holiday_date = b.holiday_date
        `);

        // 2. Add Constraint
        try {
            await client.query(`
                ALTER TABLE school_holidays 
                ADD CONSTRAINT unique_school_holiday UNIQUE (school_id, holiday_date)
            `);
            await client.query('COMMIT');
            res.json({ message: 'Schema fixed successfully (Dups removed, Constraint added).' });
        } catch (err) {
            await client.query('ROLLBACK');
            if (err.code === '42710') {
                res.json({ message: 'Constraint already exists.' });
            } else {
                throw err;
            }
        }
    } catch (error) {
        if (client) await client.query('ROLLBACK'); // Safety
        console.error('Error fixing schema:', error);
        res.status(500).json({ message: 'Error fixing schema', error: error.message });
    } finally {
        client.release();
    }
};

// INTERNAL HELPER: Ensure Holidays Exist for a School/Year (Lazy Load)
exports.ensureHolidaysForSchool = async (schoolId, year) => {
    try {
        // Check if holidays exist
        const res = await pool.query('SELECT COUNT(*) FROM school_holidays WHERE school_id = $1 AND EXTRACT(YEAR FROM holiday_date) = $2', [schoolId, year]);
        if (parseInt(res.rows[0].count) > 5) return; // Assume if > 5 holidays exist, it's populated

        console.log(`[AUTO-GEN] Generating holidays for School ${schoolId} Year ${year} (Lazy Load)`);

        // Generate
        const holidays = generateAnnualCalendar(year);
        if (holidays.length === 0) return;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const holiday of holidays) {
                const { holiday_name, holiday_date } = holiday;

                // Insert school_holidays
                await client.query(`
                    INSERT INTO school_holidays (school_id, holiday_date, holiday_name, is_paid)
                    VALUES ($1, $2, $3, true)
                    ON CONFLICT (school_id, holiday_date) DO NOTHING
                 `, [schoolId, holiday_date, holiday_name]);

                // Insert events (Check existence first to avoid dupes)
                const evtCheck = await client.query(`SELECT id FROM events WHERE school_id = $1 AND start_date = $2 AND event_type = 'Holiday'`, [schoolId, holiday_date]);
                if (evtCheck.rows.length === 0) {
                    await client.query(`
                        INSERT INTO events (school_id, title, event_type, start_date, end_date, description, audience)
                        VALUES ($1, $2, 'Holiday', $3, $3, 'Official Holiday', 'All')
                     `, [schoolId, holiday_name, holiday_date]);
                }
            }

            await client.query('COMMIT');
            console.log(`[AUTO-GEN] Completed for School ${schoolId} Year ${year}`);
        } catch (e) {
            await client.query('ROLLBACK');
            console.error(`[AUTO-GEN] Failed for School ${schoolId} Year ${year}`, e);
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Error in ensureHolidaysForSchool:', e);
    }
};
