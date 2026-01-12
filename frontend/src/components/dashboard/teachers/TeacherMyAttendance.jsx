import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import api from '../../../api/axios';

const TeacherMyAttendance = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState({});
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [startYear, setStartYear] = useState(new Date().getFullYear());

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
    }, []);

    // Generate dates for the selected month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        fetchHistory();
    }, [month, year]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/teachers/attendance/my', {
                params: { month, year }
            });
            const data = res.data || [];

            // Process array into object loop
            const rpt = {};
            let p = 0, a = 0, l = 0, t = 0;

            data.forEach(record => {
                if (record.date) {
                    const dateKey = record.date.split('T')[0]; // YYYY-MM-DD
                    rpt[dateKey] = record.status;

                    const s = record.status.toLowerCase();
                    if (s === 'present') p++;
                    else if (s === 'absent') a++;
                    else if (s === 'late') l++;
                    else if (s === 'leave') a++; // Count leave as absent or separate? Usually absent statistically or logic pending. Treating as absent for now or separate.

                    if (s !== 'holiday' && s !== 'sunday') t++;
                }
            });

            setReport(rpt);
            setStats({ present: p, absent: a, late: l, total: t });

        } catch (error) {
            console.error('Failed to load attendance history', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header Controls */}
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
                    <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Total Present</div>
                    <div className="text-3xl font-black text-slate-700">{stats.present + stats.late}</div>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
                    <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-2">Present</div>
                    <div className="text-3xl font-black text-emerald-700">{stats.present}</div>
                </div>
                <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 flex flex-col justify-between">
                    <div className="text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-2">Absent</div>
                    <div className="text-3xl font-black text-rose-700">{stats.absent}</div>
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
                    <div className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-2">Late</div>
                    <div className="text-3xl font-black text-amber-700">{stats.late}</div>
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
                        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                        const status = report[dateKey];

                        let bg = 'bg-slate-50';
                        let label = '';
                        let border = 'border-slate-100';

                        if (!status) {
                            // Empty
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
                            } else if (s === 'leave') {
                                bg = 'bg-amber-50 text-amber-600 border-amber-200';
                                label = 'LV';
                            } else if (s === 'holiday') {
                                bg = 'bg-purple-100 text-purple-700 border-purple-200';
                                label = 'H';
                            } else {
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

export default TeacherMyAttendance;
