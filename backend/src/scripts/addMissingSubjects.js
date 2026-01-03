const { pool } = require('../config/db');

const addMissingSubjects = async () => {
    try {
        const school_id = (await pool.query('SELECT id FROM schools LIMIT 1')).rows[0].id;

        // Find classes with students but no subjects
        const classes = await pool.query(`
            SELECT DISTINCT s.class_id 
            FROM students s
            WHERE s.school_id = $1 AND s.class_id IS NOT NULL 
            AND NOT EXISTS (SELECT 1 FROM subjects sub WHERE sub.class_id = s.class_id)
        `, [school_id]);

        if (classes.rows.length === 0) {
            console.log('All classes with students have subjects.');
            process.exit(0);
        }

        console.log(`Found ${classes.rows.length} classes needing subjects. Creating defaults...`);

        const defaults = ['Mathematics', 'Science', 'English', 'History'];

        for (const row of classes.rows) {
            for (const name of defaults) {
                await pool.query(`
                    INSERT INTO subjects (school_id, class_id, name, code, type)
                    VALUES ($1, $2, $3, $4, 'Theory')
                    ON CONFLICT DO NOTHING
                `, [school_id, row.class_id, name, `SUB-${row.class_id}-${name.substring(0, 3).toUpperCase()}`]);
            }
        }

        console.log('Subjects created.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

addMissingSubjects();
