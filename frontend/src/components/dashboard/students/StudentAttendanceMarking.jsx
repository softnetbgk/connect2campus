import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const StudentAttendanceMarking = ({ config }) => {
    // Force date to always be TODAY
    const date = new Date().toISOString().split('T')[0];
    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
    const [loading, setLoading] = useState(false);

    const availableSections = config.classes?.find(c => c.class_id === parseInt(filterClass))?.sections || [];

    // Auto-select section
    useEffect(() => {
        if (filterClass && availableSections.length > 0) {
            setFilterSection(availableSections[0].id);
        } else {
            setFilterSection('');
        }
    }, [filterClass]);

    useEffect(() => {
        const hasSections = availableSections.length > 0;
        if (filterClass && (filterSection || !hasSections) && date) {
            fetchAttendanceData();
        }
    }, [filterClass, filterSection, date]);

    const fetchAttendanceData = async () => {
        setLoading(true);
        try {
            const params = { date, class_id: filterClass };
            if (filterSection) params.section_id = filterSection;

            // Fetch students with their daily status directly using the daily attendance endpoint
            const res = await api.get('/students/attendance/daily', { params });
            const data = res.data;

            const statusMap = {};
            data.forEach(s => {
                // If status is 'Unmarked' (from COALESCE in backend), default to 'Present' for the UI
                // so the user can easily mark them or save as present.
                statusMap[s.id] = s.status === 'Unmarked' ? 'Present' : s.status;
            });

            setStudents(data);
            setAttendance(statusMap);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleMark = (id, status) => {
        setAttendance(prev => ({ ...prev, [id]: status }));
    };

    const handleSave = async () => {
        try {
            const attendanceData = Object.entries(attendance).map(([student_id, status]) => ({
                student_id: parseInt(student_id),
                status
            }));

            await api.post('/students/attendance', { date, attendanceData });
            toast.success('Attendance saved successfully');
        } catch (error) {
            toast.error('Failed to save attendance');
        }
    };

    const isEditable = date === new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-wrap items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</span>
                    <input
                        type="date"
                        readOnly
                        className="input max-w-[150px] bg-slate-100/50 border-slate-200 text-slate-500 font-bold cursor-not-allowed opacity-80"
                        value={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <select className="input max-w-[200px] bg-slate-50 border-slate-200" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                    <option value="">Select Class</option>
                    {config.classes?.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                </select>
                <select
                    className="input max-w-[200px] disabled:bg-slate-100 disabled:text-slate-400 bg-slate-50 border-slate-200"
                    value={filterSection}
                    onChange={e => setFilterSection(e.target.value)}
                    disabled={availableSections.length === 0}
                >
                    <option value="">{availableSections.length === 0 ? 'No Sections' : 'Select Section'}</option>
                    {availableSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {filterClass && (filterSection || availableSections.length === 0) ? (
                    <>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-slate-700">Student List</h3>
                                <p className="text-xs text-slate-500">Mark attendance for {date}</p>
                            </div>
                            <div className="flex gap-2">
                                {isEditable && (
                                    <>
                                        <button className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                            onClick={() => {
                                                const newAttendance = {};
                                                students.forEach(s => newAttendance[s.id] = 'Present');
                                                setAttendance(newAttendance);
                                            }}
                                        >Mark All Present</button>
                                        <button onClick={handleSave} className="text-xs font-bold text-white bg-indigo-600 px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-1">
                                            <Check size={14} /> Save
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="p-4 pl-6">Roll No</th>
                                        <th className="p-4">Student Name</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 pl-6 font-mono text-slate-500 font-medium">#{student.roll_number || 'N/A'}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-700">{student.name}</div>
                                                <div className="text-xs text-slate-400">{student.admission_no}</div>
                                            </td>
                                            <td className="p-4 flex justify-center gap-2">
                                                {['Present', 'Absent', 'Late'].map(status => (
                                                    <button
                                                        key={status}
                                                        disabled={!isEditable}
                                                        onClick={() => handleMark(student.id, status)}
                                                        className={`w-24 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${attendance[student.id] === status
                                                            ? status === 'Present' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
                                                                : status === 'Absent' ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/20'
                                                                    : 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                                                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                                            } ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                    {students.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-12 text-center text-slate-400">
                                                <p>No students found for this class/section.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </>
                ) : (
                    <div className="p-20 text-center flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Check size={32} className="text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-500">Select Class & Section</p>
                        <p className="text-sm">Please select a class and section to start marking attendance.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAttendanceMarking;
