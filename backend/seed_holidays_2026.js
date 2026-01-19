
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const holidays2026 = [
    { title: "New Year's Day", start_date: '2026-01-01', end_date: '2026-01-01', description: 'General Holiday' },
    { title: "Makara Sankranti", start_date: '2026-01-15', end_date: '2026-01-15', description: 'General Holiday' },
    { title: "Republic Day", start_date: '2026-01-26', end_date: '2026-01-26', description: 'National Holiday' },
    { title: "Maha Shivratri", start_date: '2026-02-15', end_date: '2026-02-15', description: 'General Holiday' },
    { title: "Ugadi", start_date: '2026-03-19', end_date: '2026-03-19', description: 'Kannada New Year' },
    { title: "Mahaveera Jayanthi", start_date: '2026-03-31', end_date: '2026-03-31', description: 'General Holiday' },
    { title: "Good Friday", start_date: '2026-04-03', end_date: '2026-04-03', description: 'General Holiday' },
    { title: "Dr. B.R. Ambedkar Jayanthi", start_date: '2026-04-14', end_date: '2026-04-14', description: 'General Holiday' },
    { title: "Basava Jayanthi / Akshaya Tritiya", start_date: '2026-04-20', end_date: '2026-04-20', description: 'General Holiday' },
    { title: "May Day", start_date: '2026-05-01', end_date: '2026-05-01', description: 'General Holiday' },
    { title: "Bakrid (Provisional)", start_date: '2026-05-28', end_date: '2026-05-28', description: 'General Holiday' },
    { title: "Last Day of Moharam (Provisional)", start_date: '2026-06-26', end_date: '2026-06-26', description: 'General Holiday' },
    { title: "Independence Day", start_date: '2026-08-15', end_date: '2026-08-15', description: 'National Holiday' },
    { title: "Eid-e-Milad (Provisional)", start_date: '2026-08-26', end_date: '2026-08-26', description: 'General Holiday' },
    { title: "Gandhi Jayanti", start_date: '2026-10-02', end_date: '2026-10-02', description: 'National Holiday' },
    { title: "Mahanavami / Ayudha Puja", start_date: '2026-10-19', end_date: '2026-10-19', description: 'General Holiday (Estimated)' },
    { title: "Vijayadashami", start_date: '2026-10-20', end_date: '2026-10-20', description: 'General Holiday (Estimated)' },
    { title: "Kannada Rajyotsava", start_date: '2026-11-01', end_date: '2026-11-01', description: 'General Holiday' },
    { title: "Deepavali", start_date: '2026-11-10', end_date: '2026-11-10', description: 'General Holiday' },
    { title: "Christmas", start_date: '2026-12-25', end_date: '2026-12-25', description: 'General Holiday' }
];

async function seedHolidays() {
    const client = await pool.connect();
    try {
        console.log('--- Seeding Government Holidays for 2026 ---');

        // 1. Get Schools
        // We will seed for ALL schools in the system for convenience, or just the first valid one if required.
        // Assuming single tenant or needing to seed for all. Let's do all.
        const schoolsRes = await client.query("SELECT id, name FROM schools");

        if (schoolsRes.rows.length === 0) {
            console.log('No schools found. Aborting.');
            return;
        }

        console.log(`Found ${schoolsRes.rows.length} schools.`);

        for (const school of schoolsRes.rows) {
            console.log(`Seeding for school: ${school.name} (${school.id})`);

            for (const holiday of holidays2026) {
                // Check if already exists
                const checkRes = await client.query(
                    "SELECT id FROM events WHERE school_id = $1 AND title = $2 AND start_date = $3",
                    [school.id, holiday.title, holiday.start_date]
                );

                if (checkRes.rows.length === 0) {
                    await client.query(
                        `INSERT INTO events (school_id, title, event_type, start_date, end_date, description, audience)
                         VALUES ($1, $2, 'Holiday', $3, $4, $5, 'All')`,
                        [school.id, holiday.title, holiday.start_date, holiday.end_date, holiday.description]
                    );
                    process.stdout.write('+');
                } else {
                    process.stdout.write('.');
                }
            }
            console.log(' Done.');
        }

        console.log('\n--- Seeding Complete ---');

    } catch (error) {
        console.error('--- Seeding Failed ---');
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedHolidays();
