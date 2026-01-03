import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const TeacherAttendanceReports = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [report, setReport] = useState([]);

    // Generate dates for the selected month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const fetchReport = async () => {
        try {
            const res = await api.get('/teachers/attendance', { params: { month, year } });
            // Process data: array of { name, date, status }
            // Transform to: [{ id, name, attendance: { date: status }, stats: { P: 0, A: 0 } }]
            const processed = {};
            res.data.forEach(row => {
                if (!processed[row.teacher_id]) processed[row.teacher_id] = {
                    name: row.name,
                    attendance: {},
                    totalP: 0,
                    totalA: 0,
                    totalL: 0
                };
                if (row.date) {
                    // Fix timezone issue
                    const dateParts = row.date.split('T')[0].split('-');
                    const d = parseInt(dateParts[2]);

                    processed[row.teacher_id].attendance[d] = row.status;
                    if (row.status === 'Present') processed[row.teacher_id].totalP++;
                    if (row.status === 'Absent') processed[row.teacher_id].totalA++;
                    if (row.status === 'Late') processed[row.teacher_id].totalL++;
                }
            });
            setReport(Object.values(processed));
        } catch (e) {
            console.error(e);
            toast.error('Failed to load report');
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
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>
                                <th className="p-3 border-b border-slate-200 text-left min-w-[200px] sticky left-0 bg-slate-50 z-20 font-bold text-slate-600 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Teacher Name</th>
                                {dates.map(d => (
                                    <th key={d} className={`p-2 border-b border-l border-slate-100 min-w-[32px] text-center font-semibold text-slate-500 bg-slate-50/50`}>
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{d}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-2 border-b border-l border-slate-200 bg-slate-50 text-slate-600 font-bold w-20 text-center sticky right-0 z-10">Total (P/A)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {report.map((r, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                                    <td className="p-3 border-b border-slate-100 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        {r.name}
                                    </td>
                                    {dates.map(d => {
                                        const status = r.attendance[d];
                                        let bg = '';
                                        let text = '';
                                        let content = '';

                                        if (status === 'Present') {
                                            bg = 'bg-emerald-100/70';
                                            text = 'text-emerald-700';
                                            content = 'P';
                                        } else if (status === 'Absent') {
                                            bg = 'bg-rose-100/70';
                                            text = 'text-rose-700';
                                            content = 'A';
                                        } else if (status === 'Late') {
                                            bg = 'bg-amber-100/70';
                                            text = 'text-amber-700';
                                            content = 'L';
                                        } else if (status === 'Leave') {
                                            bg = 'bg-blue-100/70';
                                            text = 'text-blue-700';
                                            content = 'LV';
                                        } else {
                                            content = '-';
                                            text = 'text-slate-200';
                                        }

                                        return (
                                            <td key={d} className="border-l border-slate-100 p-1 text-center h-10 w-8">
                                                <div className={`w-6 h-6 mx-auto rounded flex items-center justify-center font-bold text-[10px] ${bg} ${text}`}>
                                                    {content}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="border-l border-slate-100 text-center p-2 bg-slate-50/50 sticky right-0 z-10 backdrop-blur-sm">
                                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                                            <span className="text-emerald-600">{r.totalP}</span>
                                            <span className="text-slate-300">/</span>
                                            <span className="text-rose-600">{r.totalA}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {report.length === 0 && (
                                <tr><td colSpan={dates.length + 2} className="p-12 text-center text-slate-400">No attendance data found for this selection</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeacherAttendanceReports;
