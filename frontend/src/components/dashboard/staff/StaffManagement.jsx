import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: '', gender: '', address: '', join_date: new Date().toISOString().split('T')[0], salary_per_day: '' });
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => { fetchStaff(); }, []);

    const fetchStaff = async () => {
        try { const res = await api.get('/staff'); setStaff(res.data); }
        catch (e) { toast.error('Failed to load staff'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.phone && !/^\d{10}$/.test(formData.phone)) return toast.error('Phone must be 10 digits');

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (formData.email && !emailRegex.test(formData.email)) return toast.error('Invalid email format');

        try {
            if (isEditing) { await api.put(`/staff/${selectedId}`, formData); toast.success('Staff updated'); }
            else { await api.post('/staff', formData); toast.success('Staff added'); }
            setShowModal(false); fetchStaff();
        } catch (e) { toast.error('Failed to save staff'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete staff?')) return;
        try { await api.delete(`/staff/${id}`); toast.success('Deleted'); fetchStaff(); }
        catch (e) { toast.error('Failed to delete'); }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Staff Management</h2>
                    <p className="text-slate-500 text-sm">Manage non-teaching staff members</p>
                </div>
                <button type="button" onClick={() => { setIsEditing(false); setFormData({ name: '', email: '', phone: '', role: '', gender: '', address: '', join_date: new Date().toISOString().split('T')[0], salary_per_day: '' }); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"><Plus size={20} /> Add New Staff</button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="p-4 pl-6">ID</th>
                                <th className="p-4">Name & Role</th>
                                <th className="p-4">Salary/Day</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4 text-right pr-6">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {staff.map(t => (
                                <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 pl-6 font-mono text-slate-400 text-xs">{t.employee_id || '-'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                {t.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700">{t.name}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{t.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold text-xs border border-emerald-100">
                                            ₹{t.salary_per_day || 0}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-600 text-sm">{t.phone}</div>
                                        <div className="text-slate-400 text-xs">{t.email}</div>
                                    </td>
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setIsEditing(true); setSelectedId(t.id); setFormData(t); setShowModal(true); }} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(t.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {staff.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        No staff members found. Add one to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Staff' : 'Add New Staff'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        className="input"
                                        placeholder="Full Name"
                                        required
                                        pattern="[A-Za-z\s]+"
                                        title="Letters and spaces only"
                                        autoComplete="off"
                                        value={formData.name}
                                        onCopy={e => e.preventDefault()}
                                        onPaste={e => e.preventDefault()}
                                        onChange={e => {
                                            if (/^[A-Za-z\s]*$/.test(e.target.value)) {
                                                setFormData({ ...formData, name: e.target.value });
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Role <span className="text-red-500">*</span></label>
                                    <input
                                        className="input"
                                        placeholder="Role (e.g., Clerk, Peon)"
                                        required
                                        pattern="[A-Za-z\s]+"
                                        title="Letters and spaces only"
                                        autoComplete="off"
                                        value={formData.role}
                                        onCopy={e => e.preventDefault()}
                                        onPaste={e => e.preventDefault()}
                                        onChange={e => {
                                            if (/^[A-Za-z\s]*$/.test(e.target.value)) {
                                                setFormData({ ...formData, role: e.target.value });
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Phone <span className="text-red-500">*</span></label>
                                    <input
                                        className="input"
                                        placeholder="Phone"
                                        required
                                        maxLength={10}
                                        autoComplete="off"
                                        value={formData.phone}
                                        onCopy={e => e.preventDefault()}
                                        onPaste={e => e.preventDefault()}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        className="input"
                                        placeholder="Email"
                                        type="email"
                                        autoComplete="off"
                                        value={formData.email}
                                        onCopy={e => e.preventDefault()}
                                        onPaste={e => e.preventDefault()}
                                        onChange={e => setFormData({ ...formData, email: e.target.value.replace(/\s/g, '') })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Gender <span className="text-red-500">*</span></label>
                                    <select className="input" required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                        <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Date of Joining <span className="text-red-500">*</span></label>
                                    <input
                                        className="input"
                                        required
                                        type="date"
                                        autoComplete="off"
                                        max={new Date().toISOString().split('T')[0]}
                                        value={formData.join_date}
                                        onChange={e => setFormData({ ...formData, join_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="label">Salary Per Day <span className="text-red-500">*</span></label>
                                    <input
                                        className="input"
                                        type="number"
                                        min="0"
                                        required
                                        placeholder="0.00"
                                        autoComplete="off"
                                        value={formData.salary_per_day}
                                        onCopy={e => e.preventDefault()}
                                        onPaste={e => e.preventDefault()}
                                        onChange={e => setFormData({ ...formData, salary_per_day: e.target.value })}
                                    />
                                </div>
                            </div>
                            <textarea
                                className="input"
                                placeholder="Address"
                                rows="2"
                                value={formData.address}
                                onCopy={e => e.preventDefault()}
                                onPaste={e => e.preventDefault()}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}>
                            </textarea>

                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{isEditing ? 'Update Staff' : 'Add Staff'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;
