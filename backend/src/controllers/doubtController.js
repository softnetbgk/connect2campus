const { pool } = require('../config/db');

// Helper to find student ID
const getStudentId = async (email, school_id) => {
    let studentRes = await pool.query('SELECT id FROM students WHERE email = $1 AND school_id = $2', [email, school_id]);
    if (studentRes.rows.length === 0) {
        // Try admission no pattern
        const emailParts = email.split('@');
        if (emailParts.length === 2) {
            studentRes = await pool.query('SELECT id FROM students WHERE LOWER(admission_no) = LOWER($1) AND school_id = $2', [emailParts[0], school_id]);
        }
    }
    return studentRes.rows.length > 0 ? studentRes.rows[0].id : null;
};

// Create a new doubt (Student Only)
exports.createDoubt = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const email = req.user.email;
        let { teacher_id, subject_id, question } = req.body;

        const student_id = await getStudentId(email, school_id);
        if (!student_id) {
            console.error(`Doubt Error: Student not found for email ${email} school ${school_id}`);
            return res.status(404).json({ message: `Student profile not found for ${email}. Please contact admin.` });
        }

        // If subject_id is missing, try to resolve it from Teacher's Specialization
        if (!subject_id) {
            const teacherRes = await pool.query('SELECT subject_specialization FROM teachers WHERE id = $1', [teacher_id]);
            if (teacherRes.rows.length > 0) {
                const specialization = teacherRes.rows[0].subject_specialization;
                if (specialization) {
                    // Try to find subject by name
                    const subjectRes = await pool.query('SELECT id FROM subjects WHERE lower(name) = lower($1) AND school_id = $2', [specialization, school_id]);
                    if (subjectRes.rows.length > 0) {
                        subject_id = subjectRes.rows[0].id;
                    }
                }
            }
        }

        const result = await pool.query(
            `INSERT INTO doubts (student_id, teacher_id, subject_id, question) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [student_id, teacher_id, subject_id, question]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error creating doubt' });
    }
};

// Get doubts for logged-in Student
exports.getDoubtsForStudent = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const email = req.user.email;

        const student_id = await getStudentId(email, school_id);
        if (!student_id) return res.status(404).json({ message: 'Student profile not found' });

        const query = `
            SELECT d.*, t.name as teacher_name, s.name as subject_name
            FROM doubts d
            LEFT JOIN teachers t ON d.teacher_id = t.id
            LEFT JOIN subjects s ON d.subject_id = s.id
            WHERE d.student_id = $1
            ORDER BY d.created_at DESC
        `;
        const result = await pool.query(query, [student_id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching doubts' });
    }
};

// Get doubts for logged-in Teacher
exports.getDoubtsForTeacher = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const email = req.user.email;

        // Find teacher ID
        const teacherRes = await pool.query('SELECT id FROM teachers WHERE email = $1 AND school_id = $2', [email, school_id]);
        if (teacherRes.rows.length === 0) return res.status(404).json({ message: 'Teacher profile not found' });
        const teacher_id = teacherRes.rows[0].id;

        const query = `
            SELECT d.*, st.name as student_name, st.roll_number, c.name as class_name, sub.name as subject_name
            FROM doubts d
            JOIN students st ON d.student_id = st.id
            LEFT JOIN classes c ON st.class_id = c.id
            LEFT JOIN subjects sub ON d.subject_id = sub.id
            WHERE d.teacher_id = $1
            ORDER BY d.created_at DESC
        `;
        const result = await pool.query(query, [teacher_id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching doubts' });
    }
};

// Reply to doubt (Teacher Only)
exports.replyToDoubt = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        const result = await pool.query(
            `UPDATE doubts 
             SET answer = $1, status = 'Answered', answered_at = NOW() 
             WHERE id = $2 RETURNING *`,
            [answer, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'Doubt not found' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error replying to doubt' });
    }
};
