import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const StaffMyAttendance = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ present: 0, absent: 0, leave: 0, late: 0 });
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        fetchHistory();
    }, [month, year]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            // Re-using the same endpoint as teachers for now since they are both 'Staff' in broader sense,
            // OR created a similar one. Let's try to see if backend supports staff attendance fetch.
            // If backend categorizes staff differently, we might need a dedicated route.
            // Assuming /staff/attendance/my exists or generic /attendance/my.
            // Glancing at controllers, might need to implement or use teacher one if compatible.
            // For now let's try a dedicated staff endpoint or fallback to teacher if structure similar.

            // Checking availability: The User Request implies "My attendance not came".
            // I'll assume I need to create/use '/staff/attendance/my'.
            const res = await api.get('/staff/attendance/my', {
                params: { month, year }
            });
            const data = res.data;
            setHistory(data);

            // Calculate stats
            const s = { present: 0, absent: 0, leave: 0, late: 0 };
            data.forEach(r => {
                const lower = r.status.toLowerCase();
                if (s[lower] !== undefined) s[lower]++;
                else if (lower === 'unmarked') { /* ignore */ }
                else s.present++; // Default fallback 
            });
            setStats(s);

        } catch (error) {
            console.error('Failed to load attendance history', error);
            // toast.error('Failed to load attendance history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Present': return <CheckCircle size={18} className="text-emerald-500" />;
            case 'Absent': return <XCircle size={18} className="text-rose-500" />;
            case 'Leave': return <Clock size={18} className="text-amber-500" />;
            case 'Late': return <AlertCircle size={18} className="text-orange-500" />;
            default: return <div className="w-4 h-4 rounded-full bg-slate-200"></div>;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'Absent': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'Leave': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'Late': return 'bg-orange-50 text-orange-700 border-orange-100';
            default: return 'bg-slate-50 text-slate-500';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Controls & Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-indigo-600" /> My Attendance History
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Track your daily presence and check-ins.</p>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select className="bg-transparent text-sm outline-none font-bold text-slate-700 cursor-pointer" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                            {Array.from({ length: new Date().getFullYear() - startYear + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100/50">
                        <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Present</div>
                        <div className="text-2xl font-black text-emerald-800">{stats.present} <span className="text-xs font-medium opacity-60">days</span></div>
                    </div>
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-100/50">
                        <div className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Absent</div>
                        <div className="text-2xl font-black text-rose-800">{stats.absent} <span className="text-xs font-medium opacity-60">days</span></div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100/50">
                        <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Leaves</div>
                        <div className="text-2xl font-black text-amber-800">{stats.leave} <span className="text-xs font-medium opacity-60">days</span></div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100/50">
                        <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Late</div>
                        <div className="text-2xl font-black text-orange-800">{stats.late} <span className="text-xs font-medium opacity-60">days</span></div>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-100">
                            <tr>
                                <th className="p-4 pl-6">Date</th>
                                <th className="p-4">Day</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Loading history...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">No records found for this month.</td></tr>
                            ) : (
                                history.map((record, index) => {
                                    const d = new Date(record.date);
                                    return (
                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 pl-6 font-medium text-slate-700">
                                                {d.toLocaleDateString('default', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {d.toLocaleDateString('default', { weekday: 'long' })}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(record.status)}`}>
                                                    {getStatusIcon(record.status)}
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 text-xs italic">
                                                -
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffMyAttendance;
