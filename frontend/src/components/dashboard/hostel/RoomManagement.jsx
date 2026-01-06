import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { Plus, Trash2, Home, LayoutGrid, X } from 'lucide-react';
import toast from 'react-hot-toast';

const RoomManagement = () => {
    const [hostels, setHostels] = useState([]);
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        room_number: '',
        capacity: 2,
        cost_per_term: ''
    });

    useEffect(() => {
        fetchHostels();
    }, []);

    useEffect(() => {
        if (selectedHostel) {
            fetchRooms(selectedHostel.id);
        }
    }, [selectedHostel]);

    const fetchHostels = async () => {
        try {
            const res = await api.get('/hostel');
            setHostels(res.data);
            if (res.data.length > 0 && !selectedHostel) {
                setSelectedHostel(res.data[0]);
            }
        } catch (error) {
            toast.error('Failed to fetch hostels');
        }
    };

    const fetchRooms = async (hostelId) => {
        setLoading(true);
        try {
            const res = await api.get(`/hostel/${hostelId}/rooms`);
            setRooms(res.data);
        } catch (error) {
            toast.error('Failed to fetch rooms');
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
            await api.post(`/hostel/${selectedHostel.id}/rooms`, formData);
            toast.success('Room added successfully');
            fetchRooms(selectedHostel.id);
            setShowModal(false);
            setFormData({ room_number: '', capacity: 2, cost_per_term: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add room');
        } finally {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this room?')) return;
        try {
            await api.delete(`/hostel/rooms/${id}`);
            toast.success('Room deleted');
            fetchRooms(selectedHostel.id);
        } catch (error) {
            toast.error('Failed to delete room');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Room Management</h2>
                    <p className="text-slate-500">Configure rooms and capacity</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Home className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <select
                            className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                            value={selectedHostel?.id || ''}
                            onChange={(e) => {
                                const hostel = hostels.find(h => h.id === parseInt(e.target.value));
                                setSelectedHostel(hostel);
                            }}
                        >
                            {hostels.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                    {selectedHostel && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <Plus size={20} /> Add Room
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading rooms...</div>
            ) : rooms.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {rooms.map((room) => (
                        <div key={room.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-bl from-white via-white to-transparent">
                                <button onClick={() => handleDelete(room.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${parseInt(room.current_occupancy) >= room.capacity
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-green-600'
                                    }`}>
                                    <LayoutGrid size={20} />
                                </div>
                                <h3 className="font-bold text-slate-800">Room {room.room_number}</h3>
                                <div className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    {room.current_occupancy} / {room.capacity} Occupied
                                </div>
                                <p className="mt-2 text-xs text-slate-500 font-medium">
                                    ₹{parseFloat(room.cost_per_term).toLocaleString('en-IN')}/term
                                </p>
                            </div>

                            {/* Capacity Bar */}
                            <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${parseInt(room.current_occupancy) >= room.capacity
                                        ? 'bg-red-500'
                                        : 'bg-green-500'
                                        }`}
                                    style={{ width: `${(Math.min(parseInt(room.current_occupancy), room.capacity) / room.capacity) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <LayoutGrid className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No rooms configured for this hostel yet.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Add Room</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Room Number</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.room_number}
                                    onChange={e => setFormData({ ...formData, room_number: e.target.value })}
                                    placeholder="e.g. 101"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Beds)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cost per Term</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={formData.cost_per_term}
                                    onChange={e => setFormData({ ...formData, cost_per_term: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Room'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomManagement;
