const getSundays = (year) => {
    const dates = [];
    const date = new Date(year, 0, 1);
    while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
    }
    while (date.getFullYear() === year) {
        // Format to YYYY-MM-DD using local time logic
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        dates.push({
            holiday_name: 'Sunday',
            holiday_date: `${yearStr}-${monthStr}-${dayStr}`
        });
        date.setDate(date.getDate() + 7);
    }
    return dates;
};

const getFixedHolidays = (year) => {
    return [
        { holiday_name: 'Republic Day', holiday_date: `${year}-01-26` },
        { holiday_name: 'Ambedkar Jayanti', holiday_date: `${year}-04-14` },
        { holiday_name: 'May Day (Labour Day)', holiday_date: `${year}-05-01` },
        { holiday_name: 'Independence Day', holiday_date: `${year}-08-15` },
        { holiday_name: 'Gandhi Jayanti', holiday_date: `${year}-10-02` },
        { holiday_name: 'Kannada Rajyotsava', holiday_date: `${year}-11-01` },
        { holiday_name: 'Christmas', holiday_date: `${year}-12-25` },
        // Add Approx Dates for movable festivals? 
        // For automation, we might need a library or just accept fixed specific dates for 2026, 2027 etc.
        // For now, I will include the Fixed ones + Sundays. 
        // Movable ones are tricky without a library like 'holiday-jp' but for India.
    ];
};

exports.generateAnnualCalendar = (year) => {
    const fixed = getFixedHolidays(year);
    const sundays = getSundays(year);
    // Merge and sort
    return [...fixed, ...sundays].sort((a, b) => a.holiday_date.localeCompare(b.holiday_date));
};
