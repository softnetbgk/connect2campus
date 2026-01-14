import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const ClassManagement = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedClass, setExpandedClass] = useState(null);
    const [editingClass, setEditingClass] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form States
    const [newClassName, setNewClassName] = useState('');
    const [newSectionName, setNewSectionName] = useState('');

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            // This endpoint gets classes. We might need to fetch sections separately or eager load.
            // Current backend: getAllClasses returns classes. getSections returns sections for a class.
            const res = await api.get('/classes');
            setClasses(res.data); // data is array of classes
        } catch (error) {
            console.error(error);
            toast.error('Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    const handleAddClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        try {
            await api.post('/classes', { name: newClassName });
            toast.success('Class added successfully');
            setNewClassName('');
            setShowAddModal(false);
            fetchClasses();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add class');
        }
    };

    const handleUpdateClass = async () => {
        if (!editingClass || !editingClass.name.trim()) return;

        try {
            await api.put(`/classes/${editingClass.id}`, { name: editingClass.name });
            toast.success('Class updated');
            setEditingClass(null);
            fetchClasses();
        } catch (error) {
            toast.error('Failed to update class');
        }
    };

    const handleDeleteClass = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This requires the class to be empty (no students).`)) return;

        try {
            await api.delete(`/classes/${id}`);
            toast.success('Class deleted');
            fetchClasses();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete class');
        }
    };

    // Sub-component for managing sections of a specific class
    const SectionManager = ({ classId }) => {
        const [sections, setSections] = useState([]);
        const [secLoading, setSecLoading] = useState(true);
        const [sectionName, setSectionName] = useState('');

        useEffect(() => {
            fetchSections();
        }, [classId]);

        const fetchSections = async () => {
            try {
                const res = await api.get(`/classes/${classId}/sections`);
                setSections(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setSecLoading(false);
            }
        };

        const handleAddSection = async (e) => {
            e.preventDefault();
            if (!sectionName.trim()) return;

            try {
                await api.post(`/classes/${classId}/sections`, { name: sectionName });
                toast.success('Section added');
                setSectionName('');
                fetchSections();
            } catch (error) {
                toast.error('Failed to add section');
            }
        };

        const handleDeleteSection = async (secId) => {
            if (!window.confirm('Delete this section?')) return;
            try {
                await api.delete(`/classes/${classId}/sections/${secId}`);
                toast.success('Section deleted');
                fetchSections();
            } catch (error) {
                toast.error('Failed to delete section');
            }
        };

        if (secLoading) return <div className="p-4 text-xs text-slate-400">Loading sections...</div>;

        return (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 animate-in slide-in-from-top-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Manage Sections</h4>

                <div className="flex flex-wrap gap-2 mb-4">
                    {sections.map(sec => (
                        <div key={sec.id} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">
                            {sec.name}
                            <button
                                onClick={() => handleDeleteSection(sec.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                    {sections.length === 0 && <span className="text-xs text-slate-400 italic py-1">No sections added yet</span>}
                </div>

                <form onSubmit={handleAddSection} className="flex gap-2">
                    <input
                        type="text"
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value)}
                        placeholder="New Section (e.g. A, B, Ruby)"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 outline-none focus:border-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!sectionName.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-indigo-700"
                    >
                        Add
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black">Class Management</h2>
                            <p className="text-indigo-100 text-sm">Create and organize classes and sections</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
                    >
                        <Plus size={20} />
                        New Class
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-3">
                {classes
                    .slice()
                    .sort((a, b) => {
                        const numA = parseInt(a.name.replace(/\D/g, '') || '0', 10);
                        const numB = parseInt(b.name.replace(/\D/g, '') || '0', 10);
                        return numA === numB ? a.name.localeCompare(b.name) : numA - numB;
                    })
                    .map(cls => (
                        <div key={cls.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {expandedClass === cls.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </button>

                                    {editingClass?.id === cls.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editingClass.name}
                                                onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                                                className="border border-indigo-300 rounded px-2 py-1 text-lg font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                            <button onClick={handleUpdateClass} className="bg-green-100 text-green-700 p-1.5 rounded hover:bg-green-200"><Save size={16} /></button>
                                            <button onClick={() => setEditingClass(null)} className="bg-slate-100 text-slate-600 p-1.5 rounded hover:bg-slate-200"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditingClass(cls)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClass(cls.id, cls.name)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Expandable Section Area */}
                            {expandedClass === cls.id && (
                                <div className="px-4 pb-4">
                                    <SectionManager classId={cls.id} />
                                </div>
                            )}
                        </div>
                    ))}

                {classes.length === 0 && !loading && (
                    <div className="text-center p-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        No classes found. Add one to get started.
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Add New Class</h3>
                            <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleAddClass} className="p-6">
                            <label className="block text-sm font-bold text-slate-600 mb-2">Class Name</label>
                            <input
                                type="text"
                                placeholder="e.g. 10, 11th JEE, 12th Commerce"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newClassName.trim()}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                Create Class
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagement;
