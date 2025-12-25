import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const StudentLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        leave_type: 'Sick Leave',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await api.get('/leaves/my-leaves');
            setLeaves(res.data);
        } catch (error) {
            console.error("Failed to fetch leaves", error);
            // toast.error("Failed to load leave history");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Basic Validation
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            toast.error("End date cannot be before start date");
            setSubmitting(false);
            return;
        }

        try {
            await api.post('/leaves/my-leaves', formData);
            toast.success("Leave application submitted successfully!");
            setShowForm(false);
            setFormData({ leave_type: 'Sick Leave', start_date: '', end_date: '', reason: '' });
            fetchLeaves(); // Refresh list
        } catch (error) {
            console.error("Failed to apply leave", error);
            toast.error(error.response?.data?.message || "Failed to submit application");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return <CheckCircle size={14} />;
            case 'Rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading leave history...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Action */}
            <div className="flex justify-between items-center">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1 mr-6">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Calendar className="text-indigo-600" /> My Leaves
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        View history and apply for new leaves.
                    </p>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                    <Plus size={20} /> Apply Leave
                </button>
            </div>

            {/* Application Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-In">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Apply for Leave</h3>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleApply} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Leave Type</label>
                                <select
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                >
                                    <option value="Sick Leave">Sick Leave</option>
                                    <option value="Casual Leave">Casual Leave / Family Function</option>
                                    <option value="Medical Leave">Medical Leave (Long Term)</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">From Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">To Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                                <textarea
                                    required
                                    rows="3"
                                    placeholder="Please provide a valid reason..."
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Leave History List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-xs uppercase tracking-wide">
                    Application History
                </div>

                {leaves.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Clock className="text-slate-300" size={32} />
                        </div>
                        <h4 className="text-slate-600 font-bold">No Leave History</h4>
                        <p className="text-slate-400 text-sm mt-1">You haven't applied for any leaves yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {leaves.map((leave) => (
                            <div key={leave.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-bold text-slate-800">{leave.leave_type}</h4>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(leave.status)}`}>
                                            {getStatusIcon(leave.status)} {leave.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <span>{new Date(leave.start_date).toLocaleDateString()}</span>
                                        <span>➔</span>
                                        <span>{new Date(leave.end_date).toLocaleDateString()}</span>
                                        <span className="text-slate-300">|</span>
                                        <span className="italic">"{leave.reason}"</span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 font-medium">
                                    Applied on {new Date(leave.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentLeaves;
