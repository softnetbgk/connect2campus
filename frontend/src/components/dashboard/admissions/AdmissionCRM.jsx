import React, { useState, useEffect } from 'react';
import { Plus, Search, Check, X, Phone, Mail, UserPlus, FileText, Trash2, Edit } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const AdmissionCRM = ({ onNavigate }) => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Form State
    const [formData, setFormData] = useState({
        student_name: '',
        parent_name: '',
        contact_number: '',
        email: '',
        class_applying_for: '',
        previous_school: '',
        notes: ''
    });

    const [classes, setClasses] = useState([]);

    useEffect(() => {
        fetchEnquiries();
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const fetchEnquiries = async () => {
        try {
            const res = await api.get('/admissions');
            setEnquiries(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load enquiries');
            setLoading(false);
        }
    };

    const handleAddEnquiry = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admissions', formData);
            toast.success('Enquiry added successfully');
            setShowModal(false);
            setFormData({
                student_name: '', parent_name: '', contact_number: '', email: '',
                class_applying_for: '', previous_school: '', notes: ''
            });
            fetchEnquiries();
        } catch (error) {
            toast.error('Failed to add enquiry');
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/admissions/${id}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            fetchEnquiries();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleConvertToStudent = (enquiry) => {
        // Navigate to 'Student Admission List' and pass the enquiry data
        if (onNavigate) {
            onNavigate('student-list', {
                action: 'add_student',
                data: {
                    first_name: enquiry.student_name,
                    guardian_name: enquiry.parent_name,
                    guardian_phone: enquiry.contact_number,
                    email: enquiry.email,
                    class_name: enquiry.class_applying_for
                }
            });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this enquiry?")) return;
        try {
            await api.delete(`/admissions/${id}`);
            toast.success("Enquiry deleted");
            fetchEnquiries();
        } catch (error) {
            toast.error("Failed to delete enquiry");
        }
    };

    const filteredEnquiries = enquiries.filter(enq => {
        const matchesSearch = enq.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enq.contact_number.includes(searchTerm);
        const matchesStatus = filterStatus === 'All' || enq.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-700';
            case 'Contacted': return 'bg-yellow-100 text-yellow-700';
            case 'Interview': return 'bg-purple-100 text-purple-700';
            case 'Selected': return 'bg-emerald-100 text-emerald-700';
            case 'Admitted': return 'bg-green-100 text-green-800 border border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Admission CRM</h2>
                    <p className="text-slate-500">Manage enquiries and admissions pipeline</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> New Enquiry
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        placeholder="Search by student name or phone..."
                        autoComplete="off"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'New', 'Contacted', 'Interview', 'Selected', 'Admitted', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Enquiries List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEnquiries.map(enq => (
                    <div key={enq.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow relative group">

                        {/* Header: Status and Delete Button */}
                        <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(enq.status)}`}>
                                {enq.status}
                            </span>

                            <button
                                onClick={() => handleDelete(enq.id)}
                                className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                title="Delete Enquiry"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Date - Moved here for better visibility */}
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                            Applied: {new Date(enq.application_date).toLocaleDateString()}
                        </div>

                        <h3 className="text-lg font-bold text-slate-800">{enq.student_name}</h3>
                        <p className="text-sm text-slate-500 mb-4">Class: <span className="font-medium text-slate-700">{enq.class_applying_for}</span></p>

                        <div className="space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <UserPlus size={14} className="text-slate-400" />
                                <span>Parent: {enq.parent_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-slate-400" />
                                <span>{enq.contact_number}</span>
                            </div>
                            {enq.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{enq.email}</span>
                                </div>
                            )}
                        </div>

                        {enq.notes && (
                            <div className="mb-4 text-xs text-slate-500 italic border-l-2 border-indigo-200 pl-2">
                                "{enq.notes}"
                            </div>
                        )}

                        {/* Action Buttons */}
                        {enq.status !== 'Admitted' && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-2">
                                    {enq.status !== 'Rejected' && (
                                        <select
                                            className="w-full text-xs p-1.5 border rounded-lg bg-white"
                                            value={enq.status}
                                            onChange={(e) => handleStatusUpdate(enq.id, e.target.value)}
                                        >
                                            <option value="New">New</option>
                                            <option value="Contacted">Contacted</option>
                                            <option value="Interview">Interview</option>
                                            <option value="Selected">Selected</option>
                                            <option value="Rejected">Reject</option>
                                        </select>
                                    )}
                                    {enq.status === 'Selected' && (
                                        <button
                                            onClick={() => handleConvertToStudent(enq)}
                                            className="w-full bg-emerald-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1 col-span-2"
                                        >
                                            <Check size={14} /> Admit Student
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {filteredEnquiries.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No enquiries found matching your criteria</p>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Add New Enquiry</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>
                        <form onSubmit={handleAddEnquiry} autoComplete="off" className="p-6 space-y-4">
                            <input
                                required
                                placeholder="Student Name"
                                autoComplete="off"
                                className="w-full p-2 border rounded-lg"
                                value={formData.student_name}
                                onChange={e => setFormData({ ...formData, student_name: e.target.value.replace(/\d/g, '') })}
                                onCopy={e => e.preventDefault()}
                                onPaste={e => e.preventDefault()}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={formData.class_applying_for}
                                    onChange={e => setFormData({ ...formData, class_applying_for: e.target.value })}
                                    onCopy={e => e.preventDefault()}
                                    onPaste={e => e.preventDefault()}
                                >
                                    <option value="">Select Class Applying For</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                                <input
                                    placeholder="Previous School"
                                    autoComplete="off"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.previous_school}
                                    onChange={e => setFormData({ ...formData, previous_school: e.target.value })}
                                    onCopy={e => e.preventDefault()}
                                    onPaste={e => e.preventDefault()}
                                />
                            </div>
                            <input
                                required
                                placeholder="Parent/Guardian Name"
                                autoComplete="off"
                                className="w-full p-2 border rounded-lg"
                                value={formData.parent_name}
                                onChange={e => setFormData({ ...formData, parent_name: e.target.value.replace(/\d/g, '') })}
                                onCopy={e => e.preventDefault()}
                                onPaste={e => e.preventDefault()}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    required
                                    type="text"
                                    placeholder="Phone Number (10 digits)"
                                    autoComplete="off"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.contact_number}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setFormData({ ...formData, contact_number: val });
                                    }}
                                    pattern="\d{10}"
                                    title="Please enter exactly 10 digits"
                                    onCopy={e => e.preventDefault()}
                                    onPaste={e => e.preventDefault()}
                                />
                                <input
                                    placeholder="Email (Optional)"
                                    autoComplete="off"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    onCopy={e => e.preventDefault()}
                                    onPaste={e => e.preventDefault()}
                                />
                            </div>
                            <textarea
                                placeholder="Notes / Remarks"
                                autoComplete="off"
                                className="w-full p-2 border rounded-lg h-24"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                onCopy={e => e.preventDefault()}
                                onPaste={e => e.preventDefault()}
                            />
                            <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">
                                Save Enquiry
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdmissionCRM;
