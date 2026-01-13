import React, { useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Search, User, FileText, GraduationCap, Calendar, Award, Printer } from 'lucide-react';

const StudentOverallResult = () => {
    const [admissionNo, setAdmissionNo] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!admissionNo.trim()) {
            toast.error('Please enter an Admission Number');
            return;
        }

        setLoading(true);
        setResult(null);
        setSearched(true);

        try {
            const res = await api.get('/marks/student-all', {
                params: { admission_no: admissionNo }
            });

            if (res.data) {
                setResult(res.data);
                toast.success('Student records found');
            }
        } catch (error) {
            console.error('Error fetching student result:', error);
            const msg = error.response?.data?.message || 'Failed to fetch results';
            toast.error(msg);
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl print:hidden">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">Student Overall Result</h2>
                        <p className="text-blue-100 text-sm">View complete academic history for a student</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-6 print:hidden">
                <form onSubmit={handleSearch} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 mb-2 uppercase">Student Admission Number</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={admissionNo}
                                onChange={(e) => setAdmissionNo(e.target.value)}
                                placeholder="Enter Admission No (e.g. ST-2024-001)"
                                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:font-normal"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-[50px]"
                    >
                        {loading ? 'Searching...' : 'Search'}
                        {!loading && <Search className="w-4 h-4" />}
                    </button>
                </form>
            </div>

            {/* Results */}
            {result ? (
                <div className="space-y-6">
                    {/* Student Profile */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row justify-between items-center gap-6 border-l-4 border-blue-500 print:shadow-none print:border-0">
                        <div className="flex items-center gap-6 w-full">
                            <div className="bg-blue-50 p-4 rounded-full print:hidden">
                                <User className="w-10 h-10 text-blue-600" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black text-slate-800 uppercase">{result.student.name}</h3>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-sm text-slate-600 font-bold">
                                    <span className="bg-slate-100 px-3 py-1 rounded-lg print:bg-transparent print:p-0">ID: {result.student.admission_no}</span>
                                    <span className="bg-slate-100 px-3 py-1 rounded-lg print:bg-transparent print:p-0">Roll: {result.student.roll_number || 'N/A'}</span>
                                    {result.student.class_id && <span className="bg-slate-100 px-3 py-1 rounded-lg print:bg-transparent print:p-0">Class ID: {result.student.class_id}</span>}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 print:hidden shrink-0"
                        >
                            <Printer className="w-4 h-4" />
                            Print Report
                        </button>
                    </div>

                    {/* Exams List */}
                    <div className="grid grid-cols-1 gap-6">
                        {result.exams.length > 0 ? (
                            result.exams.map((exam, index) => (
                                <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl border border-slate-100">
                                    {/* Exam Header */}
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h4 className="font-bold text-lg text-slate-800">{exam.exam_name}</h4>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-500 uppercase">Total</div>
                                                <div className="font-black text-slate-800">{exam.total_obtained} / {exam.total_max}</div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl font-bold text-white shadow-md ${parseFloat(exam.percentage) >= 90 ? 'bg-green-500' :
                                                parseFloat(exam.percentage) >= 75 ? 'bg-blue-500' :
                                                    parseFloat(exam.percentage) >= 60 ? 'bg-indigo-500' :
                                                        parseFloat(exam.percentage) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                                }`}>
                                                {exam.percentage}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subjects Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold">
                                                <tr>
                                                    <th className="px-6 py-3 text-left">Subject</th>
                                                    <th className="px-6 py-3 text-center">Max Marks</th>
                                                    <th className="px-6 py-3 text-center">Obtained</th>
                                                    <th className="px-6 py-3 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {exam.subjects.map((sub, idx) => {
                                                    const pass = (sub.marks / sub.max) * 100 >= 35; // Assuming 35% pass
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-3 font-semibold text-slate-700">{sub.subject}</td>
                                                            <td className="px-6 py-3 text-center text-slate-500">{sub.max}</td>
                                                            <td className="px-6 py-3 text-center font-bold text-slate-800">{sub.marks}</td>
                                                            <td className="px-6 py-3 text-center">
                                                                <span className={`px-2 py-1 rounded text-xs font-bold ${pass ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                                                    {pass ? 'PASS' : 'FAIL'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No exam records found for this student.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : searched && !loading ? (
                <div className="text-center py-12 text-slate-500 bg-white rounded-2xl shadow-lg">
                    <p>Enter an Admission Number to view results.</p>
                </div>
            ) : null}
        </div>
    );
};

export default StudentOverallResult;
