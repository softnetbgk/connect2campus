const { pool } = require('../config/db');

exports.getAllClasses = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const result = await pool.query(
            'SELECT * FROM classes WHERE school_id = $1 ORDER BY name',
            [school_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { name } = req.body;
        const school_id = req.user.schoolId;

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
        const { id } = req.params;
        const { name } = req.body;
        const school_id = req.user.schoolId;

        const result = await pool.query(
            'UPDATE classes SET name = $1 WHERE id = $2 AND school_id = $3 RETURNING *',
            [name, id, school_id]
        );

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
        const { id } = req.params;
        const school_id = req.user.schoolId;

        // Check for dependencies? PG checks constraints usually.
        const result = await pool.query(
            'DELETE FROM classes WHERE id = $1 AND school_id = $2 RETURNING *',
            [id, school_id]
        );

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
        res.status(500).json({ message: 'Failed to create section' });
    }
};

exports.deleteSection = async (req, res) => {
    try {
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

        // Subjects are associated with Classes, not specific Sections
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
