const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// Create a new school with admin and configuration
const createSchool = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            name, address, contactEmail, contactNumber,
            adminEmail, adminPassword,
            classes // Array of { name, sections: [], subjects: [] }
        } = req.body;

        // Validation
        if (!name || !contactEmail || !adminEmail || !adminPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await client.query('BEGIN');

        // Generate unique 6-digit school code
        let schoolCode;
        let isUnique = false;

        while (!isUnique) {
            schoolCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random
            const check = await client.query("SELECT id FROM schools WHERE school_code = $1", [schoolCode]);
            isUnique = check.rows.length === 0;
        }

        // 1. Create School
        const schoolRes = await client.query(
            `INSERT INTO schools (name, address, contact_email, contact_number, school_code) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, school_code`,
            [name, address, contactEmail, contactNumber, schoolCode]
        );
        const schoolId = schoolRes.rows[0].id;
        const generatedCode = schoolRes.rows[0].school_code;

        // 2. Create School Admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query(
            `INSERT INTO users (email, password, role, school_id) 
             VALUES ($1, $2, 'SCHOOL_ADMIN', $3)`,
            [adminEmail, hashedPassword, schoolId]
        );

        // 3. Process Academic Configuration (Classes, Sections, Subjects)
        if (classes && Array.isArray(classes)) {
            for (const cls of classes) {
                // Insert Class
                const classRes = await client.query(
                    `INSERT INTO classes (school_id, name) VALUES ($1, $2) RETURNING id`,
                    [schoolId, cls.name]
                );
                const classId = classRes.rows[0].id;

                // Insert Sections
                if (cls.sections && Array.isArray(cls.sections)) {
                    for (const secName of cls.sections) {
                        await client.query(
                            `INSERT INTO sections (class_id, name) VALUES ($1, $2)`,
                            [classId, secName]
                        );
                    }
                }

                // Insert Subjects
                if (cls.subjects && Array.isArray(cls.subjects)) {
                    for (const subName of cls.subjects) {
                        await client.query(
                            `INSERT INTO subjects (class_id, name) VALUES ($1, $2)`,
                            [classId, subName]
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'School created successfully',
            schoolId,
            schoolCode: generatedCode,
            adminEmail
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create School Error:', error);
        res.status(500).json({
            message: 'Error creating school',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get all schools with member counts
const getSchools = async (req, res) => {
    try {
        // Fetch schools with member statistics
        const result = await pool.query(`
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM students WHERE school_id = s.id) as student_count,
                (SELECT COUNT(*) FROM teachers WHERE school_id = s.id) as teacher_count,
                (SELECT COUNT(*) FROM staff WHERE school_id = s.id) as staff_count
            FROM schools s
            ORDER BY s.created_at DESC
        `);

        // Calculate total members for each school
        const schoolsWithStats = result.rows.map(school => ({
            ...school,
            total_members: parseInt(school.student_count || 0) + parseInt(school.teacher_count || 0) + parseInt(school.staff_count || 0)
        }));

        res.json(schoolsWithStats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schools', error: error.message });
    }
};

// Get single school details with configuration
const getSchoolDetails = async (req, res) => {
    const { id } = req.params;
    await fetchSchoolDetails(id, res);
};

// Get current logged-in school admin's school details
const getMySchool = async (req, res) => {
    let id = req.user.schoolId;

    // Fallback: If schoolId is missing in token (legacy token), fetch from DB
    if (!id) {
        try {
            const uRes = await pool.query('SELECT school_id FROM users WHERE id = $1', [req.user.id]);
            if (uRes.rows.length > 0) {
                id = uRes.rows[0].school_id;
            }
        } catch (e) {
            console.error('Error fetching user school_id fallback:', e);
        }
    }

    if (!id) {
        return res.status(400).json({ message: 'No school ID associated with this user.' });
    }

    await fetchSchoolDetails(id, res);
};

// Helper function to fetch school details
const fetchSchoolDetails = async (id, res) => {
    console.log(`Getting details for school ID: ${id}`); // Debug log

    try {
        // Fetch basic school info with member counts
        const schoolRes = await pool.query(`
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM students WHERE school_id = s.id) as student_count,
                (SELECT COUNT(*) FROM teachers WHERE school_id = s.id) as teacher_count,
                (SELECT COUNT(*) FROM staff WHERE school_id = s.id) as staff_count
            FROM schools s
            WHERE s.id = $1
        `, [id]);
        if (schoolRes.rows.length === 0) {
            console.log(`School not found for ID: ${id}`);
            return res.status(404).json({ message: 'School not found' });
        }
        const school = schoolRes.rows[0];

        // Calculate total members
        school.total_members = parseInt(school.student_count || 0) + parseInt(school.teacher_count || 0) + parseInt(school.staff_count || 0);

        // Fetch Classes
        const classesRes = await pool.query(`
            SELECT 
                c.id as class_id, c.name as class_name,
                COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', s.id, 'name', s.name)) FILTER (WHERE s.id IS NOT NULL), '[]'::jsonb) as sections,
                COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id', sub.id, 'name', sub.name)) FILTER (WHERE sub.id IS NOT NULL), '[]'::jsonb) as subjects
            FROM classes c
            LEFT JOIN sections s ON c.id = s.class_id
            LEFT JOIN subjects sub ON c.id = sub.class_id
            WHERE c.school_id = $1
            GROUP BY c.id, c.name
        `, [id]);

        school.classes = classesRes.rows;

        // Fetch ALL distinct subjects for this school (for autocomplete)
        const subjectsRes = await pool.query(`
            SELECT DISTINCT name 
            FROM subjects 
            WHERE class_id IN (SELECT id FROM classes WHERE school_id = $1)
            ORDER BY name ASC
        `, [id]);
        school.subjects = subjectsRes.rows.map(r => r.name);

        console.log(`Successfully fetched details for school ID: ${id}`);
        res.json(school);
    } catch (error) {
        console.error('Error in getSchoolDetails:', error);
        res.status(500).json({ message: 'Error fetching school details', error: error.message, stack: error.stack });
    }
};

// Update school details
const updateSchool = async (req, res) => {
    const { id } = req.params;
    const { name, address, contactEmail, contactNumber, classes } = req.body;
    console.log(`[UPDATE SCHOOL] ID: ${id}, Body:`, JSON.stringify(req.body, null, 2));

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        console.log('[UPDATE SCHOOL] Transaction Started');

        // 1. Update Basic Info
        const result = await client.query(
            `UPDATE schools 
             SET name = $1, address = $2, contact_email = $3, contact_number = $4 
             WHERE id = $5 RETURNING *`,
            [name, address, contactEmail, contactNumber, id]
        );
        console.log('[UPDATE SCHOOL] Basic Info Updated');

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'School not found' });
        }

        // 2. Full Sync of Academic Configuration
        if (classes && Array.isArray(classes)) {
            // A. Get existing IDs to track what to keep
            const existingClassesRes = await client.query('SELECT id, name FROM classes WHERE school_id = $1', [id]);
            const existingClasses = existingClassesRes.rows;

            const processedClassIds = [];

            for (const cls of classes) {
                console.log(`[UPDATE SCHOOL] Processing Class Name: ${cls.name}`);
                let classId;

                // 1. Resolve Class ID
                const existingClass = existingClasses.find(ec => ec.name === cls.name);
                if (existingClass) {
                    classId = existingClass.id;
                    console.log(`[UPDATE SCHOOL] Found Existing Class ID: ${classId}`);
                } else {
                    console.log(`[UPDATE SCHOOL] Creating New Class: ${cls.name}`);
                    const newClassRes = await client.query(
                        `INSERT INTO classes (school_id, name) VALUES ($1, $2) RETURNING id`,
                        [id, cls.name]
                    );
                    classId = newClassRes.rows[0].id;
                    console.log(`[UPDATE SCHOOL] New Class ID: ${classId}`);
                    // Add to existingClasses so we don't try to create it again if duplicate names in payload
                    existingClasses.push({ id: classId, name: cls.name });
                }

                // 2. Sync Sections (JS Logic)
                const targetSections = cls.sections || [];
                const currentSectionsRes = await client.query('SELECT id, name FROM sections WHERE class_id = $1', [classId]);
                const currentSections = currentSectionsRes.rows;

                // Determine deletions - DISABLED to prevent data loss as per requirements
                /*
                if (sectionsToDelete.length > 0) {
                    console.log(`[UPDATE SCHOOL] Deleting Sections: ${sectionsToDelete.join(', ')}`);
                    await client.query('DELETE FROM sections WHERE id = ANY($1::int[])', [sectionsToDelete]);
                }
                */

                // Determine insertions
                const sectionsToAdd = targetSections.filter(name => !currentSections.some(curr => curr.name === name));

                for (const secName of sectionsToAdd) {
                    console.log(`[UPDATE SCHOOL] Adding Section: ${secName}`);
                    await client.query('INSERT INTO sections (class_id, name) VALUES ($1, $2)', [classId, secName]);
                }

                // 3. Sync Subjects (JS Logic)
                const targetSubjects = cls.subjects || [];
                const currentSubjectsRes = await client.query('SELECT id, name FROM subjects WHERE class_id = $1', [classId]);
                const currentSubjects = currentSubjectsRes.rows;

                // Determine deletions - DISABLED to prevent data loss
                /*
                const subjectsToDelete = currentSubjects
                    .filter(curr => !targetSubjects.includes(curr.name))
                    .map(curr => curr.id);

                if (subjectsToDelete.length > 0) {
                    console.log(`[UPDATE SCHOOL] Deleting Subjects: ${subjectsToDelete.join(', ')}`);
                    await client.query('DELETE FROM subjects WHERE id = ANY($1::int[])', [subjectsToDelete]);
                }
                */

                // Determine insertions
                const subjectsToAdd = targetSubjects.filter(name => !currentSubjects.some(curr => curr.name === name));

                for (const subName of subjectsToAdd) {
                    console.log(`[UPDATE SCHOOL] Adding Subject: ${subName}`);
                    await client.query('INSERT INTO subjects (class_id, name) VALUES ($1, $2)', [classId, subName]);
                }
            }

            // B. Existing Classes Protection
            // We intentionally do NOT delete classes that are missing from the input to prevent data loss.
            // The frontend might send a partial list or the user might have removed it from the UI, but we keep the DB record.
            // However, for the classes that ARE sent, we fully sync their sections and subjects (allowing expansion/modification).

            // Code block for deleting classes has been REMOVED to satisfy safety requirements.

        }

        await client.query('COMMIT');
        console.log('[UPDATE SCHOOL] Committed successfully');

        // Fetch the updated school with details to return
        const updatedSchool = result.rows[0];
        res.json({ message: 'School updated successfully', school: updatedSchool });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('[UPDATE SCHOOL] ERROR:', error);
        res.status(500).json({ message: 'Error updating school', error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
};

module.exports = { createSchool, getSchools, getSchoolDetails, updateSchool, getMySchool };
