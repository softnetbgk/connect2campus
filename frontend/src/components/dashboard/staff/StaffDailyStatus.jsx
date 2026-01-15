import React, { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, AlertCircle } from 'lucide-react';
import api from '../../../api/axios';

const StaffDailyStatus = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try { const res = await api.get('/staff/attendance/daily', { params: { date } }); setData(res.data); }
            catch (e) { }
        };
        fetch();
    }, [date]);

    const stats = {
        total: data.length,
        present: data.filter(s => s.status === 'Present').length,
        absent: data.filter(s => s.status === 'Absent').length,
        other: data.filter(s => s.status === 'Late' || s.status === 'Leave').length,
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 w-full">
                <h2 className="text-lg font-bold text-slate-700 hidden md:block mr-auto">Daily Staff Attendance</h2>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                    <Calendar size={18} className="text-slate-400" />
                    <input type="date" className="bg-transparent text-sm font-bold text-slate-700 outline-none" value={date} onChange={e => setDate(e.target.value)} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><Users size={48} className="text-indigo-600" /></div>
                    <div className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-2">Total Staff</div>
                    <div className="text-3xl font-black text-slate-700">{stats.total}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><Check size={48} className="text-emerald-600" /></div>
                    <div className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-2">Present</div>
                    <div className="text-3xl font-black text-emerald-600">{stats.present}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><X size={48} className="text-rose-600" /></div>
                    <div className="text-rose-600 text-[10px] font-bold uppercase tracking-widest mb-2">Absent</div>
                    <div className="text-3xl font-black text-rose-600">{stats.absent}</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-3 opacity-10"><AlertCircle size={48} className="text-amber-600" /></div>
                    <div className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-2">Late / Leave</div>
                    <div className="text-3xl font-black text-amber-600">{stats.other}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
                        <h3 className="text-sm font-bold text-emerald-800 uppercase flex items-center gap-2">
                            <div className="p-1 bg-emerald-100/50 rounded-md"><Check className="w-3.5 h-3.5" /></div>
                            Present Staff
                        </h3>
                        <span className="bg-white text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm">{stats.present}</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-100 sticky top-0">
                                <tr><th className="px-5 py-3 ml-2">Name</th><th className="px-5 py-3 text-right">Contact</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.filter(s => s.status === 'Present').map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-700">{i + 1}. {s.name}</td>
                                        <td className="px-5 py-3 text-right text-slate-400 text-xs font-mono">{s.phone}</td>
                                    </tr>
                                ))}
                                {stats.present === 0 && (
                                    <tr><td colSpan={2} className="p-8 text-center text-slate-400 text-xs">No staff present today</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-rose-50/50 flex justify-between items-center backdrop-blur-sm sticky top-0 z-10">
                        <h3 className="text-sm font-bold text-rose-800 uppercase flex items-center gap-2">
                            <div className="p-1 bg-rose-100/50 rounded-md"><X className="w-3.5 h-3.5" /></div>
                            Absent Staff
                        </h3>
                        <span className="bg-white text-rose-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-rose-100 shadow-sm">{stats.absent}</span>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-100 sticky top-0">
                                <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3 text-right">Contact</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.filter(s => s.status === 'Absent').map((s, i) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-5 py-3 font-medium text-slate-700">{i + 1}. {s.name}</td>
                                        <td className="px-5 py-3 text-right text-slate-400 text-xs font-mono">{s.phone}</td>
                                    </tr>
                                ))}
                                {stats.absent === 0 && (
                                    <tr><td colSpan={2} className="p-8 text-center text-slate-400 text-xs">No staff absent today (All Present)</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Late / Leave Section */}
            {data.filter(s => s.status === 'Late' || s.status === 'Leave').length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                    <div className="p-4 border-b border-slate-100 bg-amber-50/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-amber-800 uppercase">Late / Leave</h3>
                        <span className="bg-white text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-amber-100 shadow-sm">{stats.other}</span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.filter(s => s.status === 'Late' || s.status === 'Leave').map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">{s.phone}</span>
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${s.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {s.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDailyStatus;
