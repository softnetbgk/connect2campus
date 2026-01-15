const { pool } = require('../config/db');

exports.getAllClasses = async (req, res) => {
    try {
        let school_id = req.user.schoolId;

        // Allow Super Admin to fetch classes for a specific school
        if (req.user.role === 'SUPER_ADMIN' && req.query.schoolId) {
            school_id = req.query.schoolId;
        }

        let result;
        if (req.user.role === 'SUPER_ADMIN' && !school_id) {
            // Super Admin seeing all classes across all schools
            result = await pool.query(
                `SELECT c.*, s.name as school_name 
                 FROM classes c 
                 JOIN schools s ON c.school_id = s.id 
                 ORDER BY s.name, c.name`
            );
        } else {
            // Standard fetch for specific school
            result = await pool.query(
                'SELECT * FROM classes WHERE school_id = $1 ORDER BY name',
                [school_id]
            );
        }

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createClass = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can create classes.' });
        }
        const { name, schoolId } = req.body;

        let school_id = req.user.schoolId;

        // Allow Super Admin to create class for a specific school
        if (req.user.role === 'SUPER_ADMIN' && schoolId) {
            school_id = schoolId;
        }

        if (!name) {
            return res.status(400).json({ message: 'Class name is required' });
        }

        const result = await pool.query(
            'INSERT INTO classes (school_id, name) VALUES ($1, $2) RETURNING *',
            [school_id, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Class name already exists' });
        }
        res.status(500).json({ message: 'Failed to create class' });
    }
};

exports.updateClass = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can update classes.' });
        }
        const { id } = req.params;
        const { name } = req.body;

        // We don't strictly need school_id for update if we trust the ID, 
        // but verifying ownership is good.
        let school_id = req.user.schoolId;

        let query = 'UPDATE classes SET name = $1 WHERE id = $2 AND school_id = $3 RETURNING *';
        let params = [name, id, school_id];

        // Super Admin can update any class (bypass school check or check specific school)
        if (req.user.role === 'SUPER_ADMIN') {
            query = 'UPDATE classes SET name = $1 WHERE id = $2 RETURNING *';
            params = [name, id];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Class name already exists' });
        }
        res.status(500).json({ message: 'Failed to update class' });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can delete classes.' });
        }
        const { id } = req.params;

        let school_id = req.user.schoolId;

        let query = 'DELETE FROM classes WHERE id = $1 AND school_id = $2 RETURNING *';
        let params = [id, school_id];

        if (req.user.role === 'SUPER_ADMIN') {
            query = 'DELETE FROM classes WHERE id = $1 RETURNING *';
            params = [id];
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Cannot delete class with existing students/sections' });
        }
        res.status(500).json({ message: 'Failed to delete class' });
    }
};

exports.getSections = async (req, res) => {
    try {
        const { classId } = req.params;
        const result = await pool.query(
            'SELECT * FROM sections WHERE class_id = $1 ORDER BY name',
            [classId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createSection = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can create sections.' });
        }
        const { classId } = req.params;
        const { name } = req.body;

        // Security check: ensure class belongs to school (if strict)
        // For now relying on simple logic

        const result = await pool.query(
            'INSERT INTO sections (class_id, name) VALUES ($1, $2) RETURNING *',
            [classId, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Section name already exists in this class' });
        }
        res.status(500).json({ message: 'Failed to create section' });
    }
};

exports.deleteSection = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can delete sections.' });
        }
        const { classId, sectionId } = req.params;
        const result = await pool.query(
            'DELETE FROM sections WHERE id = $1 AND class_id = $2 RETURNING *',
            [sectionId, classId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Section not found' });
        }
        res.json({ message: 'Section deleted' });

    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Cannot delete section with existing students' });
        }
        res.status(500).json({ message: 'Failed to delete section' });
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const { classId } = req.params;

        // Subjects are associated with Classes
        const result = await pool.query(
            'SELECT * FROM subjects WHERE class_id = $1 ORDER BY id',
            [classId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createSubject = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can create subjects.' });
        }
        const { classId } = req.params;
        const { name, code, type } = req.body; // type: 'Theory', 'Practical', etc.

        const result = await pool.query(
            'INSERT INTO subjects (class_id, name, code, type) VALUES ($1, $2, $3, $4) RETURNING *',
            [classId, name, code, type || 'Theory']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create subject' });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can update subjects.' });
        }
        const { classId, subjectId } = req.params;
        const { name, code, type } = req.body;

        const result = await pool.query(
            'UPDATE subjects SET name = $1, code = $2, type = $3 WHERE id = $4 AND class_id = $5 RETURNING *',
            [name, code, type, subjectId, classId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update subject' });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can delete subjects.' });
        }
        const { classId, subjectId } = req.params;
        const result = await pool.query(
            'DELETE FROM subjects WHERE id = $1 AND class_id = $2 RETURNING *',
            [subjectId, classId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        console.error(error);
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Cannot delete subject with existing marks/exams' });
        }
        res.status(500).json({ message: 'Failed to delete subject' });
    }
};

exports.updateSection = async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Access denied: Only Super Admin can update sections.' });
        }
        const { classId, sectionId } = req.params;
        const { name } = req.body;

        const result = await pool.query(
            'UPDATE sections SET name = $1 WHERE id = $2 AND class_id = $3 RETURNING *',
            [name, sectionId, classId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Section not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Section name already exists in this class' });
        }
        res.status(500).json({ message: 'Failed to update section' });
    }
};
