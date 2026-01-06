const { pool } = require('../config/db');

exports.getGrades = async (req, res) => {
    try {
        const school_id = req.user.schoolId;
        const result = await pool.query(
            'SELECT * FROM grades WHERE school_id = $1 ORDER BY min_percentage DESC',
            [school_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ message: 'Server error fetching grades' });
    }
};

exports.saveGrades = async (req, res) => {
    const client = await pool.connect();
    try {
        const school_id = req.user.schoolId;
        const { grades } = req.body;

        if (!grades || !Array.isArray(grades)) {
            return res.status(400).json({ message: 'Grades data required' });
        }

        await client.query('BEGIN');

        // Delete existing grades for this school (simplest bulk update strategy for this use case)
        // Or we could upsert. Let's try upsert to preserve IDs if possible, but bulk replace is cleaner for "Setting Configuration" style UI.
        // Actually, preventing ID churn is better for history references if we link marks to grade IDs later. 
        // But currently marks likely just use the calculated grade or we calculate it on fly.
        // Let's go with DELETE ALL and INSERT NEW for simplicity as this is a configuration setting.

        await client.query('DELETE FROM grades WHERE school_id = $1', [school_id]);

        for (const grade of grades) {
            await client.query(
                `INSERT INTO grades (school_id, name, min_percentage, max_percentage, grade_point, description)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [school_id, grade.name, grade.min_percentage, grade.max_percentage, grade.grade_point, grade.description]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Grades configuration saved' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving grades:', error);
        res.status(500).json({ message: 'Server error saving grades' });
    } finally {
        client.release();
    }
};
