import React, { useState, useEffect } from 'react';
import { Plus, Trash2, IndianRupee, User, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const FeeConfiguration = ({ config }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // Submission Lock
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = React.useRef(false);

    // Student Detail / Edit Mode
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentFees, setStudentFees] = useState([]);
    const [formData, setFormData] = useState({ title: '', amount: '', due_date: '' });

    // Computed
    const sections = config?.classes?.find(c => c.class_id === parseInt(selectedClass))?.sections || [];

    useEffect(() => {
        setSelectedStudent(null); // Clear form when class/section changes
        if (selectedClass) fetchStudents();
        else setStudents([]);
    }, [selectedClass, selectedSection]);

    useEffect(() => {
        if (selectedStudent) fetchStudentFees();
    }, [selectedStudent]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/fees/overview?class_id=${selectedClass}&section_id=${selectedSection}`);
            setStudents(res.data.students || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchStudentFees = async () => {
        try {
            const res = await api.get(`/fees/student/${selectedStudent.id}`);
            setStudentFees(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAddFee = async (e) => {
        e.preventDefault();

        if (isSubmitting || isSubmittingRef.current) return;
        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            await api.post('/fees/student-structure', {
                ...formData,
                student_id: selectedStudent.id
            });
            toast.success('Fee Added to Student');
            setFormData({ title: '', amount: '', due_date: '' });
            fetchStudentFees();
            fetchStudents(); // Refresh main list stats
        } catch (e) { toast.error('Failed to add fee'); }
        finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const handleDeleteFee = async (id) => {
        if (!confirm('Delete this fee?')) return;

        if (isSubmitting || isSubmittingRef.current) return;
        setIsSubmitting(true);
        isSubmittingRef.current = true;

        try {
            await api.delete(`/fees/structures/${id}`);
            toast.success('Fee Removed');
            fetchStudentFees();
            fetchStudents();
        } catch (e) { toast.error('Delete failed'); }
        finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const formatCurrency = (amount) => {
        return parseFloat(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Splitting Logic
    const configuredStudents = students.filter(s => s.total_fee > 0);
    const nonConfiguredStudents = students.filter(s => s.total_fee == 0);

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6 animate-in fade-in">
            {/* Left Panel: Lists */}
            <div className="w-1/2 flex flex-col gap-4">
                {/* Header */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                    <select className="input flex-1" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
                        <option value="">Select Class</option>
                        {config?.classes?.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                    </select>
                    <select className="input flex-1" value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                        <option value="">All Sections</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {/* Lists Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {/* Configured List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 bg-green-50 border-b border-green-100 flex justify-between items-center">
                            <h3 className="font-bold text-green-800 flex items-center gap-2"><CheckCircle size={16} /> Configured Students</h3>
                            <span className="badge bg-green-200 text-green-800">{configuredStudents.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {configuredStudents.map(s => (
                                <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${selectedStudent?.id === s.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                                    <div>
                                        <p className="font-bold text-gray-800">{s.name}</p>
                                        <p className="text-xs text-gray-500">{s.admission_no} • ₹{formatCurrency(s.total_fee)}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            ))}
                            {configuredStudents.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No configured students</p>}
                        </div>
                    </div>

                    {/* Non-Configured List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2"><AlertCircle size={16} /> Non-Configured Students</h3>
                            <span className="badge bg-gray-200 text-gray-700">{nonConfiguredStudents.length}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {nonConfiguredStudents.map(s => (
                                <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${selectedStudent?.id === s.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}>
                                    <div>
                                        <p className="font-medium text-gray-800">{s.name}</p>
                                        <p className="text-xs text-gray-400">{s.admission_no}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            ))}
                            {nonConfiguredStudents.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">All students configured</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Editor */}
            <div className="w-1/2 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
                {selectedStudent ? (
                    <>
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{selectedStudent.name}</h2>
                            <p className="text-gray-500">{selectedStudent.admission_no}</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Current Fees List */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-sm text-gray-500 uppercase">Current Fees</h3>
                                {studentFees.map(f => (
                                    <div key={f.fee_structure_id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div>
                                            <p className="font-bold text-gray-800">{f.title}</p>
                                            <p className="text-xs text-gray-500">Due: {new Date(f.due_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <span className="font-mono font-bold text-gray-700">₹{formatCurrency(f.total_amount)}</span>
                                            <button onClick={() => handleDeleteFee(f.fee_structure_id)} className="text-red-400 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed" disabled={isSubmitting}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                                {studentFees.length === 0 && <p className="text-center text-gray-400 italic">No fees assigned</p>}
                            </div>

                            {/* Add Fee Form */}
                            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2"><Plus size={18} /> Add Fee for {selectedStudent.name.split(' ')[0]}</h3>
                                <form onSubmit={handleAddFee} className="space-y-4">
                                    <div>
                                        <label className="label text-indigo-900">Fee Title</label>
                                        <input className="input bg-white" placeholder="e.g. Tuition Fee" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label text-indigo-900">Amount</label>
                                        <div className="relative">
                                            <IndianRupee size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input className="input pl-10 bg-white" type="number" placeholder="0.00" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label text-indigo-900">Due Date</label>
                                        <input type="date" className="input bg-white" required value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                                    </div>
                                    <button type="submit" className="btn-primary w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Fee to Student'}</button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <User size={48} className="mb-4 text-gray-200" />
                        <p>Select a student from the list to manage their fees</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeeConfiguration;
