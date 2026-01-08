const { pool } = require('../config/db');

// Get or Create Exam Types
exports.getExamTypes = async (req, res) => {
    try {
        const school_id = req.user.schoolId;

        // Get exam types
        const examTypesResult = await pool.query(
            `SELECT * FROM exam_types WHERE school_id = $1 ORDER BY name`,
            [school_id]
        );

        // Get components for each exam type
        const examTypes = await Promise.all(examTypesResult.rows.map(async (examType) => {
            const componentsResult = await pool.query(
                `SELECT * FROM exam_components WHERE exam_type_id = $1 ORDER BY display_order`,
                [examType.id]
            );
            return {
                ...examType,
                components: componentsResult.rows
            };
        }));

        res.json(examTypes);
    } catch (error) {
        console.error('Error fetching exam types:', error);
        res.status(500).json({ message: 'Server error fetching exam types' });
    }
};

exports.createExamType = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { name, max_marks, min_marks, start_month, end_month, weightage, components } = req.body;

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO exam_types (school_id, name, max_marks, min_marks, start_month, end_month, weightage)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [school_id, name, max_marks || 100, min_marks || 35, start_month || 1, end_month || 12, weightage || 0]
        );

        const examType = result.rows[0];

        // If components are provided, insert them
        if (components && Array.isArray(components) && components.length > 0) {
            for (let i = 0; i < components.length; i++) {
                const component = components[i];
                await client.query(
                    `INSERT INTO exam_components (exam_type_id, component_name, max_marks, display_order)
                     VALUES ($1, $2, $3, $4)`,
                    [examType.id, component.name, component.max_marks, i + 1]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(examType);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating exam type:', error);
        res.status(500).json({ message: 'Server error creating exam type' });
    } finally {
        client.release();
    }
};

exports.updateExamType = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;
        const { name, max_marks, min_marks, start_month, end_month } = req.body;

        const result = await pool.query(
            `UPDATE exam_types 
             SET name = $1, max_marks = COALESCE($2, max_marks), min_marks = COALESCE($3, min_marks), 
                 start_month = COALESCE($4, start_month), end_month = COALESCE($5, end_month)
             WHERE id = $6 AND school_id = $7 RETURNING *`,
            [name, max_marks, min_marks, start_month, end_month, id, school_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Exam type not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating exam type:', error);
        res.status(500).json({ message: 'Server error updating exam type' });
    }
};

exports.deleteExamType = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { id } = req.params;

        await client.query('BEGIN');

        // Delete related schedules
        await client.query('DELETE FROM exam_schedules WHERE exam_type_id = $1 AND school_id = $2', [id, school_id]);

        // Delete related marks
        await client.query('DELETE FROM marks WHERE exam_type_id = $1 AND school_id = $2', [id, school_id]);

        // Delete related exam components
        await client.query('DELETE FROM exam_components WHERE exam_type_id = $1', [id]);

        // Delete the type
        const result = await client.query('DELETE FROM exam_types WHERE id = $1 AND school_id = $2 RETURNING *', [id, school_id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Exam type not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Exam type deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting exam type:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// Get Marks for a Class/Section/Exam
exports.getMarks = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { class_id, section_id, exam_type_id, year, month } = req.query;

        if (!class_id || !exam_type_id) {
            return res.status(400).json({ message: 'Class and Exam Type are required' });
        }

        let query = `SELECT m.*, 
                    st.name as student_name,
                    st.admission_no as admission_number,
                    st.roll_number,
                    sub.name as subject_name,
                    et.name as exam_name,
                    et.max_marks
             FROM marks m
             JOIN students st ON m.student_id = st.id
             LEFT JOIN subjects sub ON m.subject_id = sub.id
             JOIN exam_types et ON m.exam_type_id = et.id
             WHERE m.school_id = $1 AND m.class_id = $2 AND m.exam_type_id = $3`;

        const params = [school_id, class_id, exam_type_id];

        if (section_id) {
            params.push(section_id);
            query += ` AND m.section_id = $${params.length}`;
        }

        if (year) {
            params.push(year);
            query += ` AND m.year = $${params.length}`;
        }

        query += ` ORDER BY st.roll_number, sub.name`;

        const result = await pool.query(query, params);

        // If no marks found, return empty array
        if (!result.rows || result.rows.length === 0) {
            return res.json([]);
        }

        // Fetch component marks for each mark
        const marksWithComponents = await Promise.all(result.rows.map(async (mark) => {
            try {
                const componentsResult = await pool.query(
                    `SELECT mc.*, ec.component_name, ec.max_marks as component_max_marks
                     FROM mark_components mc
                     JOIN exam_components ec ON mc.component_id = ec.id
                     WHERE mc.mark_id = $1
                     ORDER BY ec.display_order`,
                    [mark.id]
                );
                return {
                    ...mark,
                    components: componentsResult.rows || []
                };
            } catch (compError) {
                console.error('Error fetching components for mark:', mark.id, compError);
                return {
                    ...mark,
                    components: []
                };
            }
        }));

        res.json(marksWithComponents);
    } catch (error) {
        console.error('Error fetching marks:', error);
        res.status(500).json({ message: 'Server error fetching marks', error: error.message });
    }
};

exports.getMyMarks = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Find student linked to this user
        const studentRes = await pool.query(
            `SELECT s.id, s.school_id 
             FROM students s 
             JOIN users u ON LOWER(s.email) = LOWER(u.email)
             WHERE u.id = $1`,
            [user_id]
        );

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const student = studentRes.rows[0];

        // Fetch exams and marks for this student
        const marksResult = await pool.query(
            `SELECT m.*, 
                    sub.name as subject_name,
                    et.name as exam_name
             FROM marks m
             JOIN subjects sub ON m.subject_id = sub.id
             JOIN exam_types et ON m.exam_type_id = et.id
             WHERE m.student_id = $1
             ORDER BY et.name, sub.name`,
            [student.id]
        );

        // Fetch components
        const marksWithComponents = await Promise.all(marksResult.rows.map(async (mark) => {
            const componentsResult = await pool.query(
                `SELECT mc.*, ec.component_name 
                 FROM mark_components mc
                 JOIN exam_components ec ON mc.component_id = ec.id
                 WHERE mc.mark_id = $1`,
                [mark.id]
            );
            return {
                ...mark,
                components: componentsResult.rows || []
            };
        }));

        res.json(marksWithComponents);
    } catch (error) {
        console.error('Error fetching my marks:', error);
        res.status(500).json({ message: 'Server error fetching your marks' });
    }
};

exports.saveMarks = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { marks, year } = req.body;

        if (!marks || !Array.isArray(marks) || marks.length === 0) {
            return res.status(400).json({ message: 'Marks data is required' });
        }

        const targetYear = year || new Date().getFullYear();

        await client.query('BEGIN');

        for (const mark of marks) {
            const rowYear = mark.year || targetYear;

            // Allow section_id to be NULL or 0 if not provided
            const sectionVal = mark.section_id || null;

            if (mark.component_id) {
                // Component-based mark

                const mainMarkResult = await client.query(
                    `INSERT INTO marks 
                     (school_id, student_id, class_id, section_id, subject_id, exam_type_id, marks_obtained, year, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, 0, $7, CURRENT_TIMESTAMP)
                     ON CONFLICT (school_id, student_id, subject_id, exam_type_id, year)
                     DO UPDATE SET marks_obtained = marks.marks_obtained, updated_at = CURRENT_TIMESTAMP
                     RETURNING id`,
                    [school_id, mark.student_id, mark.class_id, sectionVal,
                        mark.subject_id, mark.exam_type_id, rowYear]
                );

                const markId = mainMarkResult.rows[0].id;

                await client.query(
                    `INSERT INTO mark_components (mark_id, component_id, marks_obtained)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (mark_id, component_id)
                     DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained`,
                    [markId, mark.component_id, mark.marks_obtained]
                );

                const totalResult = await client.query(
                    `SELECT COALESCE(SUM(marks_obtained), 0) as total 
                     FROM mark_components 
                     WHERE mark_id = $1`,
                    [markId]
                );

                await client.query(
                    `UPDATE marks SET marks_obtained = $1 WHERE id = $2`,
                    [totalResult.rows[0].total, markId]
                );
            } else {
                // Simple mark OR JSON-based Component Mark
                await client.query(
                    `INSERT INTO marks 
                     (school_id, student_id, class_id, section_id, subject_id, exam_type_id, marks_obtained, remarks, year, component_scores, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
                     ON CONFLICT (school_id, student_id, subject_id, exam_type_id, year)
                     DO UPDATE SET 
                        marks_obtained = EXCLUDED.marks_obtained,
                        remarks = EXCLUDED.remarks,
                        component_scores = EXCLUDED.component_scores,
                        updated_at = CURRENT_TIMESTAMP`,
                    [school_id, mark.student_id, mark.class_id, sectionVal,
                        mark.subject_id, mark.exam_type_id, mark.marks_obtained, mark.remarks || null, rowYear, mark.component_scores || {}]
                );
            }
        }

        await client.query('COMMIT');

        // Notification Logic
        const { sendPushNotification } = require('../services/notificationService');
        const uniqueStudentIds = [...new Set(marks.map(m => m.student_id))];
        for (const studentId of uniqueStudentIds) {
            await sendPushNotification(studentId, 'Exam Results', 'New marks have been updated in your report card.');
        }
        res.json({ message: 'Marks saved successfully', count: marks.length });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving marks:', error);
        res.status(500).json({ message: 'Server error saving marks' });
    } finally {
        client.release();
    }
};

exports.getStudentMarksheet = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { student_id, exam_type_id } = req.query;

        if (!student_id || !exam_type_id) {
            return res.status(400).json({ message: 'Student ID and Exam Type are required' });
        }

        // Get student info
        const studentRes = await pool.query(
            `SELECT st.*, c.name as class_name, sec.name as section_name
             FROM students st
             JOIN classes c ON st.class_id = c.id
             LEFT JOIN sections sec ON st.section_id = sec.id
             WHERE st.id = $1 AND st.school_id = $2`,
            [student_id, school_id]
        );

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = studentRes.rows[0];

        // Get Marks
        // Get Marks
        let marksQuery = `SELECT m.*, 
                    sub.name as subject_name,
                    et.name as exam_name,
                    et.max_marks
             FROM marks m
             JOIN subjects sub ON m.subject_id = sub.id
             JOIN exam_types et ON m.exam_type_id = et.id
             WHERE m.student_id = $1 AND m.exam_type_id = $2`;

        const marksParams = [student_id, exam_type_id];

        if (req.query.year) {
            marksParams.push(req.query.year);
            marksQuery += ` AND m.year = $${marksParams.length}`;
        }

        marksQuery += ` ORDER BY sub.name`;

        const marksResult = await pool.query(marksQuery, marksParams);

        // Fetch components for these marks
        const marksWithComponents = await Promise.all(marksResult.rows.map(async (mark) => {
            const componentsResult = await pool.query(
                `SELECT mc.*, ec.component_name, ec.max_marks as component_max_marks
                 FROM mark_components mc
                 JOIN exam_components ec ON mc.component_id = ec.id
                 WHERE mc.mark_id = $1
                 ORDER BY ec.display_order`,
                [mark.id]
            );
            return {
                ...mark,
                components: componentsResult.rows || []
            };
        }));

        const totalMarks = marksWithComponents.reduce((sum, m) => sum + parseFloat(m.marks_obtained || 0), 0);
        const maxMarks = marksWithComponents.reduce((sum, m) => sum + parseFloat(m.max_marks || 0), 0);
        const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : 0;

        const marksheet = {
            student,
            marks: marksWithComponents,
            summary: {
                total_marks: totalMarks,
                max_marks: maxMarks,
                percentage
            }
        };

        res.json(marksheet);
    } catch (error) {
        console.error('Error fetching student marksheet:', error);
        res.status(500).json({ message: 'Server error fetching marksheet' });
    }
};

exports.getStudentResultYears = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { student_id } = req.query;

        if (!student_id) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const result = await pool.query(
            `SELECT DISTINCT year FROM marks WHERE student_id = $1 AND school_id = $2 ORDER BY year DESC`,
            [student_id, school_id]
        );

        res.json(result.rows.map(row => row.year));
    } catch (error) {
        console.error('Error fetching student years:', error);
        res.status(500).json({ message: 'Server error fetching years' });
    }
};

exports.getAllMarksheets = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const { class_id, section_id, exam_type_id } = req.query;

        if (!class_id || !exam_type_id) {
            return res.status(400).json({ message: 'Class and Exam Type are required' });
        }

        // Get all students in this class/section
        // Adjust query to support optional section
        let studentsQuery = `SELECT st.*, c.name as class_name, sec.name as section_name
             FROM students st
             JOIN classes c ON st.class_id = c.id
             LEFT JOIN sections sec ON st.section_id = sec.id
             WHERE st.class_id = $1 AND st.school_id = $2`;

        const params = [class_id, school_id];

        if (section_id) {
            params.push(section_id);
            studentsQuery += ` AND st.section_id = $${params.length}`;
        }

        studentsQuery += ` ORDER BY st.roll_number`;

        const studentsResult = await pool.query(studentsQuery, params);

        const marksheets = [];

        for (const student of studentsResult.rows) {
            const marksResult = await pool.query(
                `SELECT m.*, 
                        sub.name as subject_name,
                        et.name as exam_name,
                        et.max_marks
                 FROM marks m
                 JOIN subjects sub ON m.subject_id = sub.id
                 JOIN exam_types et ON m.exam_type_id = et.id
                 WHERE m.student_id = $1 AND m.exam_type_id = $2 AND m.school_id = $3
                 ORDER BY sub.name`,
                [student.id, exam_type_id, school_id]
            );

            const totalMarks = marksResult.rows.reduce((sum, m) => sum + parseFloat(m.marks_obtained || 0), 0);
            const maxMarks = marksResult.rows.reduce((sum, m) => sum + parseFloat(m.max_marks || 0), 0);
            const percentage = maxMarks > 0 ? ((totalMarks / maxMarks) * 100).toFixed(2) : 0;

            marksheets.push({
                student,
                marks: marksResult.rows,
                summary: {
                    total_marks: totalMarks,
                    max_marks: maxMarks,
                    percentage
                }
            });
        }

        res.json(marksheets);
    } catch (error) {
        console.error('Error fetching all marksheets:', error);
        res.status(500).json({ message: 'Server error fetching marksheets' });
    }
};
