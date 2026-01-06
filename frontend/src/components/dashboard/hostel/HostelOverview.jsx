import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Plus, Edit2, Trash2, Home, MapPin, Phone, User, X } from 'lucide-react';
import toast from 'react-hot-toast';

const HostelOverview = () => {
    const [hostels, setHostels] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Boys',
        address: '',
        warden_name: '',
        contact_number: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchHostels();
    }, []);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel');
            setHostels(res.data);
        } catch (error) {
            toast.error('Failed to fetch hostels');
        } finally {
            setLoading(false);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = React.useRef(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting || isSubmittingRef.current) return;

        setIsSubmitting(true);
        isSubmittingRef.current = true;
        try {
            if (editingId) {
                await api.put(`/hostel/${editingId}`, formData);
                toast.success('Hostel updated successfully');
            } else {
                await api.post('/hostel', formData);
                toast.success('Hostel added successfully');
            }
            fetchHostels();
            setShowModal(false);
            resetForm();
        } catch (error) {
            toast.error('Operation failed');
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will delete all rooms and allocations associated with this hostel.')) return;
        try {
            await api.delete(`/hostel/${id}`);
            toast.success('Hostel deleted successfully');
            fetchHostels();
        } catch (error) {
            toast.error('Failed to delete hostel');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', type: 'Boys', address: '', warden_name: '', contact_number: '' });
        setEditingId(null);
    };

    const handleEdit = (hostel) => {
        setFormData({
            name: hostel.name,
            type: hostel.type,
            address: hostel.address,
            warden_name: hostel.warden_name,
            contact_number: hostel.contact_number
        });
        setEditingId(hostel.id);
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Hostel Overview</h2>
                    <p className="text-slate-500">Manage hostel buildings and wardens</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} /> Add Hostel
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hostels.map((hostel) => (
                        <div key={hostel.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(hostel)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-full">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(hostel.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-full">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hostel.type === 'Boys' ? 'bg-blue-100 text-blue-600' :
                                    hostel.type === 'Girls' ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'
                                    }`}>
                                    <Home size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{hostel.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${hostel.type === 'Boys' ? 'bg-blue-50 text-blue-600' :
                                        hostel.type === 'Girls' ? 'bg-pink-50 text-pink-600' : 'bg-purple-50 text-purple-600'
                                        }`}>
                                        {hostel.type} Hostel
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex items-start gap-3">
                                    <User size={16} className="mt-0.5 text-slate-400" />
                                    <div>
                                        <p className="font-medium text-slate-700">{hostel.warden_name || 'No Warden'}</p>
                                        <p className="text-xs text-slate-400">Warden</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>{hostel.contact_number || 'N/A'}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin size={16} className="mt-0.5 text-slate-400" />
                                    <span className="line-clamp-2">{hostel.address || 'No Address'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {hostels.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <Home className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <p>No hostels found. Add your first hostel to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">{editingId ? 'Edit Hostel' : 'Add New Hostel'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hostel Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Swami Vivekananda Hostel"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <select
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="Boys">Boys</option>
                                    <option value="Girls">Girls</option>
                                    <option value="Co-ed">Co-ed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Warden Name</label>
                                <input
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.warden_name}
                                    onChange={e => setFormData({ ...formData, warden_name: e.target.value })}
                                    placeholder="e.g. Mr. Sharma"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                                <input
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.contact_number}
                                    onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    rows="3"
                                    placeholder="Enter full address"
                                ></textarea>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : (editingId ? 'Update Hostel' : 'Create Hostel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostelOverview;
