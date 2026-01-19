import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../../api/axios';

const StudentMyAttendance = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState(null);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [startYear, setStartYear] = useState(new Date().getFullYear());

    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchSchoolStartYear = async () => {
            try {
                const res = await api.get('/schools/my-school');
                if (res.data.created_at) {
                    setStartYear(new Date(res.data.created_at).getFullYear());
                }
            } catch (error) {
                console.error("Failed to fetch school info", error);
            }
        };
        fetchSchoolStartYear();
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/calendar/events');
            setEvents(res.data);
        } catch (error) {
            console.error('Failed to load events');
        }
    };

    // Generate dates for the selected month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        fetchMyAttendance();
    }, [month, year]);

    const fetchMyAttendance = async () => {
        setLoading(true);
        console.log('Fetching my attendance for:', month, year);
        try {
            const res = await api.get('/students/attendance/my-report', { params: { month, year } });
            console.log('My Attendance Data:', res.data);

            // Handle flat response structure
            const data = res.data;
            setReport(data.report || {});

            // Check if stats are nested (legacy) or flat (current)
            if (data.stats) {
                setStats(data.stats);
            } else {
                setStats({
                    present: data.presentDays || 0,
                    absent: data.absentDays || 0,
                    late: data.lateDays || 0,
                    total: data.totalDays || 0
                });
            }
        } catch (error) {
            console.error('Failed to load my attendance', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                    <Calendar size={18} className="text-slate-400" />
                    <select className="bg-transparent text-sm outline-none font-bold text-slate-700 cursor-pointer" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                    <div className="w-px h-4 bg-slate-300 mx-2"></div>
                    <select className="bg-transparent text-sm outline-none font-bold text-slate-700 cursor-pointer" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                        {Array.from({ length: new Date().getFullYear() - startYear + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                {loading && <span className="text-xs text-slate-400 font-medium animate-pulse">Updating...</span>}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Days</div>
                    <div className="text-3xl font-black text-slate-700">{stats?.total || 0}</div>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                    <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-2">Present</div>
                    <div className="text-3xl font-black text-emerald-700">{stats?.present || 0}</div>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 flex flex-col justify-between">
                    <div className="text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-2">Absent</div>
                    <div className="text-3xl font-black text-rose-700">{stats?.absent || 0}</div>
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
                    <div className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-2">Late</div>
                    <div className="text-3xl font-black text-amber-700">{stats?.late || 0}</div>
                </div>
            </div>

            {/* Calendar View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-700 mb-4">Daily Attendance Log</h3>
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase py-2">{d}</div>
                    ))}

                    {/* Padding for start of month */}
                    {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square"></div>
                    ))}

                    {dates.map(date => {
                        // Construct YYYY-MM-DD key manually to avoid timezone issues with toISOString
                        // Note: month is 1-indexed here
                        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

                        // Robust lookup (try full date string, then padded day just in case)
                        const status = report && (report[dateKey] || report[String(date).padStart(2, '0')]);

                        let bg = 'bg-slate-50';
                        let label = '';
                        let border = 'border-slate-100';

                        // Check for Sunday explicitly
                        const isSunday = new Date(year, month - 1, date).getDay() === 0;

                        if (isSunday) {
                            bg = 'bg-rose-100 text-rose-700 border-rose-200';
                            label = 'S';
                        }

                        // Override with specific status if present (e.g., Present on Sunday), 
                        // BUT user specifically asked to change "H symbol" (Holiday) to "S".
                        // So if status is 'Holiday' or 'Sunday' (from backend), we keep our 'S'.
                        // If status is 'Present', we might want to keep it 'Present'.

                        if (status) {
                            border = 'border shadow-sm';
                            const s = status.toLowerCase();
                            if (s === 'present') {
                                bg = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                label = 'P';
                            } else if (s === 'absent') {
                                bg = 'bg-rose-100 text-rose-700 border-rose-200';
                                label = 'A';
                            } else if (s === 'late') {
                                bg = 'bg-amber-100 text-amber-700 border-amber-200';
                                label = 'L';
                            } else if (s === 'half day' || s === 'halfday') {
                                bg = 'bg-blue-100 text-blue-700 border-blue-200';
                                label = 'HD';
                            } else if (s === 'holiday') {
                                // If it's a Sunday, we already set it to 'S' and Red above.
                                // Only overwrite if it is NOT a Sunday (e.g. public holiday)
                                if (!isSunday) {
                                    bg = 'bg-purple-100 text-purple-700 border-purple-200';
                                    label = 'H';
                                }
                            } else if (s === 'sunday') {
                                // Explicit backend 'Sunday' status -> Ensure it matches requested style
                                bg = 'bg-rose-100 text-rose-700 border-rose-200';
                                label = 'S';
                            } else if (s === 'unmarked') {
                                // Explicitly handle unmarked as gray without label
                                bg = 'bg-gray-50 text-gray-400';
                                label = '';
                            } else {
                                // Unknown status
                                // User requested to remove "U" symbol (Unmarked/Unknown)
                                // We will suppress the label for unknown statuses to be safe, or just show others.
                                if (!isSunday) {
                                    bg = 'bg-gray-50 text-gray-500';
                                    // If it starts with U, hide it based on user feedback, otherwise show first char?
                                    // Safest is to hide label for unknown to avoid "U" confusion.
                                    label = '';
                                }
                            }
                        } else if (isSunday) {
                            // No status data, but it is Sunday -> Show S
                            bg = 'bg-rose-100 text-rose-700 border-rose-200';
                            label = 'S';
                        }

                        // Check if there is an event for this date to show its name
                        const eventForDay = events.find(e => {
                            const d = new Date(e.start_date);
                            return d.getDate() === date && d.getMonth() === month - 1 && d.getFullYear() === year && e.title.toLowerCase() !== 'sunday';
                        });

                        if (eventForDay) {
                            // If it's a holiday/event, overwrite the label with the event title
                            // We keep the background color if it was already set (e.g. from 'holiday' status), 
                            // or default to purple if it wasn't set yet (though usually holiday status would set it).
                            if (!bg || bg.includes('gray-50')) {
                                bg = 'bg-purple-100 text-purple-700 border-purple-200';
                            }
                            // If status was already holiday (purple), keep it.
                            label = eventForDay.title;
                        }

                        return (
                            <div key={date} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${bg} ${border} p-1`}>
                                <span className="text-sm font-bold">{date}</span>
                                {label && (
                                    <span className={`text-[9px] font-black uppercase text-center leading-tight line-clamp-2 ${label.length > 5 ? 'text-[8px]' : ''}`}>
                                        {label}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Events / Holidays List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 bg-rose-500 rounded-full"></span>
                    Holidays & Events
                </h3>
                <div className="space-y-3">
                    {(() => {
                        const monthEvents = events.filter(e => {
                            const d = new Date(e.start_date);
                            // Filter out generic Sunday events if they exist
                            if (e.title.toLowerCase() === 'sunday') return false;
                            return d.getMonth() === month - 1 && d.getFullYear() === year;
                        }).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                        if (monthEvents.length === 0) {
                            return <div className="text-slate-400 text-sm text-center py-4">No events or holidays for this month.</div>;
                        }

                        return monthEvents.map(event => (
                            <div key={event.id} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="text-center bg-rose-50 rounded-lg p-2 min-w-[50px] border border-rose-100">
                                    <span className="block text-[10px] font-bold text-rose-400 uppercase">
                                        {new Date(event.start_date).toLocaleString('default', { month: 'short' })}
                                    </span>
                                    <span className="block text-lg font-black text-rose-600">
                                        {new Date(event.start_date).getDate()}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{event.title}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{event.event_type} {event.description ? `- ${event.description}` : ''}</p>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
    );
};

export default StudentMyAttendance;
