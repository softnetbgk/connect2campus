const { pool } = require('../config/db');

// Get Exam Schedule
exports.getExamSchedule = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { class_id, section_id, exam_type_id } = req.query;

        if (!exam_type_id && !class_id) {
            return res.status(400).json({ message: 'Exam Type or Class ID is required' });
        }

        let query = `
            SELECT es.*, sub.name as subject_name, c.name as class_name, s.name as section_name, et.name as exam_type_name
            FROM exam_schedules es
            JOIN subjects sub ON es.subject_id = sub.id
            JOIN classes c ON es.class_id = c.id
            LEFT JOIN sections s ON es.section_id = s.id
            JOIN exam_types et ON es.exam_type_id = et.id
            WHERE es.school_id = $1 
        `;

        const params = [school_id];
        let paramIndex = 2;

        if (exam_type_id) {
            query += ` AND es.exam_type_id = $${paramIndex}`;
            params.push(exam_type_id);
            paramIndex++;
        }

        if (class_id) {
            query += ` AND es.class_id = $${paramIndex}`;
            params.push(class_id);
            paramIndex++;
        }

        if (section_id) {
            query += ` AND es.section_id = $${paramIndex}`;
            params.push(section_id);
            paramIndex++;
        }

        query += ` ORDER BY es.exam_date, es.start_time`;

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching exam schedule:', error);
        res.status(500).json({ message: 'Server error fetching schedule' });
    }
};

// Save Exam Schedule
exports.saveExamSchedule = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { schedules, delete_existing } = req.body;
        // schedules: Array of { class_id, section_id, exam_type_id, subject_id, exam_date, start_time, end_time }

        if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
            return res.status(400).json({ message: 'No schedules provided' });
        }

        await client.query('BEGIN');

        // Optional: Delete existing schedules for these classes/sections/exam before saving
        if (delete_existing) {
            const keys = new Set(schedules.map(s => `${s.class_id}-${s.section_id}-${s.exam_type_id}`));
            for (const key of keys) {
                const [cid, sid, eid] = key.split('-');
                await client.query(
                    `DELETE FROM exam_schedules 
                      WHERE school_id = $1 AND class_id = $2 AND section_id = $3 AND exam_type_id = $4`,
                    [school_id, cid, sid, eid]
                );
            }
        }

        for (const schedule of schedules) {
            await client.query(
                `INSERT INTO exam_schedules 
                 (school_id, exam_type_id, class_id, section_id, subject_id, exam_date, start_time, end_time, components)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [school_id, schedule.exam_type_id, schedule.class_id, schedule.section_id, schedule.subject_id,
                    schedule.exam_date, schedule.start_time, schedule.end_time, JSON.stringify(schedule.components || [])]
            );
        }

        await client.query('COMMIT');

        // Notify Students in affected classes
        try {
            const { sendPushNotification } = require('../services/notificationService');
            // Find unique class/section combinations
            const combos = new Set(schedules.map(s => `${s.class_id}-${s.section_id}`));

            for (const combo of combos) {
                const [cid, sid] = combo.split('-');
                const studentsRes = await pool.query( // Using pool here to avoid blocking client release if slow
                    'SELECT id FROM students WHERE school_id = $1 AND class_id = $2 AND section_id = $3',
                    [school_id, cid, sid]
                );

                for (const stu of studentsRes.rows) {
                    await sendPushNotification(stu.id, 'Exam Schedule', 'The exam schedule for your class has been updated.');
                }
            }
        } catch (notifyError) {
            console.error('Notification error:', notifyError);
            // Don't fail the request if notification fails
        }

        res.json({ message: 'Exam schedule saved successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving exam schedule:', error);
        res.status(500).json({ message: 'Server error saving schedule' });
    } finally {
        client.release();
    }
};

// Update Single Exam Schedule Item
exports.updateExamScheduleItem = async (req, res) => {
    try {
        const { id } = req.params;
        const school_id = req.user.schoolId;
        const { exam_date, start_time, end_time, components } = req.body;

        const result = await pool.query(
            `UPDATE exam_schedules 
             SET exam_date = $1, start_time = $2, end_time = $3, components = $4
             WHERE id = $5 AND school_id = $6
             RETURNING *`,
            [exam_date, start_time, end_time, JSON.stringify(components || []), id, school_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Schedule item not found' });
        }

        res.json({ message: 'Schedule updated successfully', item: result.rows[0] });
    } catch (error) {
        console.error('Error updating schedule item:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
