import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const TeacherMyStudents = ({ teacherProfile }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (teacherProfile?.assigned_class_id && teacherProfile?.assigned_section_id) {
            fetchStudents();
        } else {
            setLoading(false);
        }
    }, [teacherProfile]);

    const fetchStudents = async () => {
        try {
            // Using the existing student list endpoint with filters
            const res = await api.get('/students', {
                params: {
                    class_id: teacherProfile.assigned_class_id,
                    section_id: teacherProfile.assigned_section_id
                }
            });
            setStudents(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_no?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!teacherProfile?.assigned_class_id) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50">
                <div className="bg-slate-200 p-4 rounded-full mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-600">No Class Assigned</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                    You have not been assigned as a Class Teacher yet. Please contact the administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">My Students</h2>
                    <p className="text-slate-500">
                        Class {teacherProfile.class_name} - Section {teacherProfile.section_name}
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search student..."
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value.replace(/[^a-zA-Z0-9 ]/g, ''))}
                        />
                    </div>
                </div>
            </div>

            {/* Student Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading students...</div>
            ) : filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                            <div className="flex items-start justify-between mb-4 relative">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 border-2 border-white shadow-sm">
                                    {student.gender === 'Female' ? '👧' : '👦'}
                                </div>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold font-mono">
                                    #{student.roll_number}
                                </span>
                            </div>

                            <div className="mb-4 relative">
                                <h3 className="font-bold text-slate-800 text-lg truncate">{student.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">Adm No: {student.admission_no}</p>
                            </div>

                            <div className="space-y-2 text-sm text-slate-500 relative">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-indigo-400" />
                                    <span>{student.contact_number || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-indigo-400" />
                                    <span className="truncate">{student.address || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No students found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default TeacherMyStudents;
