import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../../api/axios';

const StudentMyAttendance = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState(null);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [loading, setLoading] = useState(false);

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
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() + i).map(year => (
                            <option key={year} value={year}>{year}</option>
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

                        if (!status) {
                            // Default empty
                        } else {
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
                                bg = 'bg-purple-100 text-purple-700 border-purple-200';
                                label = 'H';
                            } else {
                                // Unknown status
                                bg = 'bg-gray-100 text-gray-700';
                                label = status[0];
                            }
                        }

                        return (
                            <div key={date} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${bg} ${border}`}>
                                <span className="text-sm font-bold">{date}</span>
                                {label && <span className="text-[10px] font-black uppercase">{label}</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentMyAttendance;
