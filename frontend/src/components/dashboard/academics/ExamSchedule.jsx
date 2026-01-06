import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, Save, Hash, Plus, Printer, Trash2, RefreshCw, Edit2, Settings, X } from 'lucide-react';

const ExamSchedule = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [examTypes, setExamTypes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [sections, setSections] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');

    // Multi-select classes/sections
    const [targetClasses, setTargetClasses] = useState([]); // [{ class_id, section_id, class_name, section_name }]
    const [availableSubjects, setAvailableSubjects] = useState([]);

    // Schedule Data
    const [schedule, setSchedule] = useState([]);

    // Auto-Generate Configuration
    const [showAutoModal, setShowAutoModal] = useState(false);
    // subjectConfigs: { [subjectId]: { selected: boolean, date: string, startTime: string, endTime: string, components: [] } }
    const [subjectConfigs, setSubjectConfigs] = useState({});
    const [activeConfigSubject, setActiveConfigSubject] = useState(null); // { id, name, components }

    // Add Exam Type Modal
    const [showAddExamModal, setShowAddExamModal] = useState(false);
    const [newExamName, setNewExamName] = useState('');
    const [showEditExamModal, setShowEditExamModal] = useState(false);
    const [editExamName, setEditExamName] = useState('');

    // Single Schedule Item Edit
    const [editItem, setEditItem] = useState(null); // { id, date, startTime, endTime, components: [], subject_name, max_marks }
    const [showEditItemModal, setShowEditItemModal] = useState(false);

    useEffect(() => {
        fetchExamTypes();
        fetchClasses();
    }, []);

    useEffect(() => {
        if (targetClasses.length > 0) {
            fetchSubjects();
        }
    }, [targetClasses]);

    useEffect(() => {
        if (selectedExam) {
            fetchExistingSchedule();
        } else {
            setSchedule([]);
        }
    }, [selectedExam]);

    // Format time to 12-hour format
    const formatTime12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    };

    const fetchExamTypes = async () => {
        try {
            const res = await api.get('/marks/exam-types');
            setExamTypes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/classes');
            setClasses(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSections = async (classId) => {
        try {
            const res = await api.get(`/classes/${classId}/sections`);
            setSections(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSubjects = async () => {
        // Collect all unique subjects for selected classes
        // For simplicity, we'll fetch subjects for the FIRST selected class and assume uniformity 
        // OR fetch all and deduplicate.
        if (targetClasses.length === 0) return;

        try {
            const uniqueSubjects = new Map();
            for (const target of targetClasses) {
                const res = await api.get(`/classes/${target.class_id}/sections/${target.section_id}/subjects`);
                res.data.forEach(sub => {
                    if (!uniqueSubjects.has(sub.id)) {
                        uniqueSubjects.set(sub.id, sub);
                    }
                });
            }
            setAvailableSubjects(Array.from(uniqueSubjects.values()));

            // Initialize subject configs
            const initialConfigs = {};
            Array.from(uniqueSubjects.values()).forEach(sub => {
                initialConfigs[sub.id] = {
                    selected: false,
                    date: '',
                    startTime: '09:00',
                    endTime: '12:00',
                    components: [] // [{ name: 'Theory', max_marks: 70 }]
                };
            });
            setSubjectConfigs(initialConfigs);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddClass = (classId, sectionId) => {
        if (!classId || !sectionId) return;
        const cls = classes.find(c => c.id === parseInt(classId));
        // We need section name, which implies we need to fetch sections or have them
        // Let's assume sections are fetched when class is selected in a dropdown
        // Implementation detail: create a mini form for adding class
    };

    const fetchExistingSchedule = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exam-schedule', {
                params: { exam_type_id: selectedExam }
            });
            // Map keys if necessary, but backend now returns matching keys
            // Need to ensure keys match state shape: id, class_id, section_id, class_name, section_name, subject_id, subject_name, exam_date, start_time, end_time
            // Backend returns: id, school_id, exam_type_id, class_id, section_id, subject_id, exam_date, start_time, end_time, created_at, subject_name, class_name, section_name
            const mapped = res.data.map(item => ({
                ...item,
                // Ensure date string is YYYY-MM-DD
                exam_date: item.exam_date.split('T')[0]
            }));
            setSchedule(mapped);
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch existing schedule');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        const selectedSubs = Object.entries(subjectConfigs)
            .filter(([_, cfg]) => cfg.selected)
            .map(([id, cfg]) => ({ id: parseInt(id), ...cfg }));

        if (selectedSubs.length === 0) {
            toast.error('Please select at least one subject');
            return;
        }

        const incomplete = selectedSubs.find(s => !s.date || !s.startTime || !s.endTime);
        if (incomplete) {
            toast.error('Please fill all date and time fields for selected subjects');
            return;
        }

        // Validate Dates against Exam Period
        const selectedExamType = examTypes.find(e => e.id === parseInt(selectedExam));
        if (selectedExamType) {
            const startM = selectedExamType.start_month;
            const endM = selectedExamType.end_month;

            for (const sub of selectedSubs) {
                const d = new Date(sub.date);
                const m = d.getMonth() + 1; // 1-12

                let isValid = false;
                if (startM <= endM) {
                    if (m >= startM && m <= endM) isValid = true;
                } else {
                    // Span across year e.g. Dec(12) to Jan(1)
                    if (m >= startM || m <= endM) isValid = true;
                }

                if (!isValid) {
                    const subName = availableSubjects.find(s => s.id === sub.id)?.name;
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    // Just a warning to console, allow user to proceed as they requested "take between month between year when date picked"
                    console.warn(`Subject '${subName}' date is technically outside exam type months (${months[startM - 1]} - ${months[endM - 1]}), but allowing as per dynamic scheduling.`);
                    // toast.error(...) - Removed strict blocking
                }
            }
        }

        // Validate Components
        // const selectedExamType is already defined above
        const examMaxMarks = selectedExamType?.max_marks || 100;

        for (const sub of selectedSubs) {
            const comps = sub.components || [];
            if (comps.length > 0) {
                const total = comps.reduce((sum, c) => sum + (parseFloat(c.max_marks) || 0), 0);
                if (total !== examMaxMarks) {
                    const subName = availableSubjects.find(s => s.id === sub.id)?.name;
                    toast.error(`Subject '${subName}' components sum (${total}) doesn't match exam max marks (${examMaxMarks})`);
                    return;
                }
            } else {

            }
        }

        const newSchedule = [];

        selectedSubs.forEach(sub => {
            // Create schedule item for EACH target class
            targetClasses.forEach(target => {
                newSchedule.push({
                    id: Date.now() + Math.random(), // Temp ID
                    class_id: target.class_id,
                    section_id: target.section_id,
                    class_name: target.class_name,
                    section_name: target.section_name,
                    subject_id: sub.id,
                    subject_name: availableSubjects.find(s => s.id === sub.id)?.name,
                    exam_date: sub.date,
                    start_time: sub.startTime,
                    end_time: sub.endTime,
                    components: sub.components || []
                });
            });
        });

        setSchedule(newSchedule);
        setShowAutoModal(false);
        toast.success(`Generated ${newSchedule.length} schedule entries`);
    };

    const handleSave = async () => {
        if (!selectedExam) {
            toast.error('Select an exam first');
            return;
        }
        if (schedule.length === 0) return;

        setLoading(true);
        try {
            const payload = schedule.map(item => ({
                exam_type_id: parseInt(selectedExam),
                class_id: item.class_id,
                section_id: item.section_id,
                subject_id: item.subject_id,
                exam_date: item.exam_date,
                start_time: item.start_time,
                end_time: item.end_time,
                components: item.components || []
            }));

            await api.post('/exam-schedule/save', {
                schedules: payload,
                delete_existing: true // Overwrite for these classes
            });
            toast.success('Exam schedule saved!');
        } catch (error) {
            toast.error('Failed to save schedule');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateScheduleItem = async () => {
        if (!editItem) return;

        // Validation: Components Total
        const total = (editItem.components || []).reduce((sum, c) => sum + (parseFloat(c.max_marks) || 0), 0);
        if (editItem.components.length > 0 && total !== editItem.max_marks) {
            toast.error(`Components total (${total}) must match exam max marks (${editItem.max_marks})`);
            return;
        }

        try {
            await api.put(`/exam-schedule/${editItem.id}`, {
                exam_date: editItem.date,
                start_time: editItem.startTime,
                end_time: editItem.endTime,
                components: editItem.components
            });
            toast.success('Schedule updated successfully');
            setShowEditItemModal(false);
            fetchExistingSchedule(); // Refresh list
        } catch (error) {
            console.error(error);
            toast.error('Failed to update schedule');
        }
    };

    const handleAddExamType = async () => {
        if (!newExamName.trim()) {
            toast.error('Please enter exam type name');
            return;
        }

        try {
            const res = await api.post('/marks/exam-types', {
                name: newExamName.trim(),
                max_marks: 100, // Default max marks
                weightage: 0
            });
            toast.success('Exam type added!');
            setExamTypes([...examTypes, res.data]);
            setSelectedExam(res.data.id);
            setNewExamName('');
            setShowAddExamModal(false);
        } catch (error) {
            toast.error('Failed to add exam type');
            console.error(error);
        }
    };

    const handleUpdateExamType = async () => {
        if (!editExamName.trim()) {
            toast.error('Please enter exam type name');
            return;
        }

        try {
            const res = await api.put(`/marks/exam-types/${selectedExam}`, {
                name: editExamName.trim()
            });
            toast.success('Exam type updated!');
            setExamTypes(examTypes.map(e => e.id === parseInt(selectedExam) ? res.data : e));
            setEditExamName('');
            setShowEditExamModal(false);
        } catch (error) {
            toast.error('Failed to update exam type');
            console.error(error);
        }
    };

    const handleDeleteExamType = async () => {
        if (!selectedExam) return;
        if (!window.confirm('Are you sure you want to delete this exam type? This will delete all associated schedules and marks.')) return;

        try {
            await api.delete(`/marks/exam-types/${selectedExam}`);
            toast.success('Exam type deleted successfully');
            setSelectedExam('');
            setSchedule([]);
            fetchExamTypes();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete exam type');
        }
    };

    const openEditModal = () => {
        const currentParams = examTypes.find(e => e.id === parseInt(selectedExam));
        if (currentParams) {
            setEditExamName(currentParams.name);
            setShowEditExamModal(true);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Helper to format Date
    const formatDate = (d) => new Date(d).toLocaleDateString();

    const selectedExamType = examTypes.find(e => e.id === parseInt(selectedExam));

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header / Selection */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
                <div className="flex flex-col md:flex-row items-end gap-4">
                    <div className="w-full md:w-1/3 min-w-[250px]">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Select Exam Type</label>
                        <div className="flex gap-2">
                            <select
                                value={selectedExam}
                                onChange={(e) => setSelectedExam(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Select Exam --</option>
                                {examTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={openEditModal}
                                disabled={!selectedExam}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1"
                                title="Edit Exam Type"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => setShowAddExamModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1"
                                title="Add New Exam Type"
                            >
                                <Plus size={18} />
                            </button>
                            <button
                                onClick={handleDeleteExamType}
                                disabled={!selectedExam}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1"
                                title="Delete Exam Type"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Class Selector */}
                    <div className="flex-1 min-w-[200px] max-w-xs">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Target Classes</label>
                        <ClassMultiSelector
                            classes={classes}
                            onAdd={(cls) => setTargetClasses([...targetClasses, cls])}
                            onRemove={(idx) => setTargetClasses(targetClasses.filter((_, i) => i !== idx))}
                            selected={targetClasses}
                        />
                    </div>

                    <div className="flex gap-2 print:hidden">
                        <button
                            onClick={() => setShowAutoModal(true)}
                            disabled={!selectedExam || targetClasses.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            <RefreshCw size={18} /> Auto Generate
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={schedule.length === 0 || loading}
                            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            <Save size={18} /> Save
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={schedule.length === 0}
                            className="bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            <Printer size={18} /> Download
                        </button>
                    </div>
                </div>
            </div>

            {/* Schedule View */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col print:shadow-none print:border-none">

                {/* Print Header */}
                <div className="hidden print:block text-center mb-6 pt-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wider text-black">Exam Schedule</h1>
                    {selectedExam && (
                        <h2 className="text-xl font-semibold mt-2 text-black">
                            {examTypes.find(t => t.id === parseInt(selectedExam))?.name}
                        </h2>
                    )}
                </div>

                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
                    <h3 className="font-bold text-slate-700">Exam Schedule Preview</h3>
                    <div className="text-sm text-slate-500">
                        {targetClasses.length > 0 ? (
                            <span>Showing {schedule.filter(s => targetClasses.some(t => t.class_id == s.class_id && t.section_id == s.section_id)).length} filtered entries</span>
                        ) : (
                            <span>{schedule.length} entries</span>
                        )}
                    </div>
                </div>

                <div className="overflow-auto flex-1 p-0">
                    {/* Screen View Table */}
                    <table className="w-full text-sm text-left print:hidden">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                            <tr>
                                <th className="p-3 border-b">Class</th>
                                <th className="p-3 border-b">Date</th>
                                <th className="p-3 border-b">Time</th>
                                <th className="p-3 border-b">Subject</th>
                                <th className="p-3 border-b print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(targetClasses.length > 0
                                ? schedule.filter(s => targetClasses.some(t => t.class_id == s.class_id && t.section_id == s.section_id))
                                : schedule
                            ).map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                                    <td className="p-3 font-medium text-indigo-600 print:text-black">{item.class_name} - {item.section_name}</td>
                                    <td className="p-3">
                                        <div className="print:hidden">
                                            <input
                                                type="date"
                                                value={item.exam_date}
                                                onChange={(e) => {
                                                    setSchedule(prev => prev.map(s =>
                                                        s.id === item.id ? { ...s, exam_date: e.target.value } : s
                                                    ));
                                                }}
                                                className="border rounded px-2 py-1"
                                            />
                                        </div>
                                        <div className="hidden print:block">
                                            {formatDate(item.exam_date)}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1 print:hidden">
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="time"
                                                    value={item.start_time}
                                                    onChange={(e) => {
                                                        setSchedule(prev => prev.map(s =>
                                                            s.id === item.id ? { ...s, start_time: e.target.value } : s
                                                        ));
                                                    }}
                                                    className="border rounded px-2 py-1 w-24 text-xs"
                                                />
                                                <span className="text-xs text-slate-500">
                                                    ({formatTime12Hour(item.start_time)})
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="time"
                                                    value={item.end_time}
                                                    onChange={(e) => {
                                                        setSchedule(prev => prev.map(s =>
                                                            s.id === item.id ? { ...s, end_time: e.target.value } : s
                                                        ));
                                                    }}
                                                    className="border rounded px-2 py-1 w-24 text-xs"
                                                />
                                                <span className="text-xs text-slate-500">
                                                    ({formatTime12Hour(item.end_time)})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden print:block">
                                            {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
                                        </div>
                                    </td>
                                    <td className="p-3 font-bold">{item.subject_name}</td>
                                    <td className="p-3 print:hidden">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditItem({
                                                        id: item.id,
                                                        date: item.exam_date, // YYYY-MM-DD
                                                        startTime: item.start_time,
                                                        endTime: item.end_time,
                                                        components: item.components || [],
                                                        subject_name: item.subject_name,
                                                        // We might need max_marks from the exam type to validate. examTypes is available.
                                                        max_marks: examTypes.find(e => e.id === parseInt(selectedExam))?.max_marks || 100
                                                    });
                                                    setShowEditItemModal(true);
                                                }}
                                                className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                                                title="Edit Schedule Item"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => setSchedule(prev => prev.filter(s => s.id !== item.id))} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {schedule.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-400">
                                        No schedule generated. Use Auto Generate to start.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Print View (Grouped by Class) */}
                    <div className="hidden print:block p-4">
                        {Object.values((targetClasses.length > 0
                            ? schedule.filter(s => targetClasses.some(t => t.class_id === s.class_id && t.section_id === s.section_id))
                            : schedule
                        ).reduce((acc, item) => {
                            const key = `${item.class_id}-${item.section_id}`;
                            if (!acc[key]) {
                                acc[key] = {
                                    className: item.class_name,
                                    sectionName: item.section_name,
                                    items: []
                                };
                            }
                            acc[key].items.push(item);
                            return acc;
                        }, {})).map((group, idx) => (
                            <div key={idx} className="mb-8 break-inside-avoid">
                                <h3 className="text-lg font-bold mb-2 border-b-2 border-slate-800 pb-1 text-black">
                                    Class: {group.className} - {group.sectionName}
                                </h3>
                                <table className="w-full text-sm text-left mb-4">
                                    <thead>
                                        <tr className="border-b border-slate-400">
                                            <th className="py-2 font-semibold text-black">Date</th>
                                            <th className="py-2 font-semibold text-black">Time</th>
                                            <th className="py-2 font-semibold text-black">Subject</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {group.items.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date)).map(item => (
                                            <tr key={item.id}>
                                                <td className="py-2 text-black">{formatDate(item.exam_date)}</td>
                                                <td className="py-2 text-black">
                                                    {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
                                                </td>
                                                <td className="py-2 font-bold text-black">{item.subject_name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Auto Generate Modal */}
            {
                showAutoModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="font-bold text-lg">Configure Exam Schedule</h3>
                                <p className="text-sm text-slate-500">Select subjects and set their exam date and timing</p>
                                {selectedExam && (
                                    <div className="mt-2 bg-blue-50 p-2 rounded text-xs text-blue-700 font-bold border border-blue-100 flex gap-4">
                                        <span>
                                            Exam Type Period: {(() => {
                                                const et = examTypes.find(e => e.id === parseInt(selectedExam));
                                                if (!et) return '';
                                                const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                return `${m[et.start_month - 1]} - ${m[et.end_month - 1]}`;
                                            })()}
                                        </span>
                                        <span className="text-indigo-600">
                                            Scheduled Period: {(() => {
                                                const dates = Object.values(subjectConfigs)
                                                    .filter(c => c.selected && c.date)
                                                    .map(c => new Date(c.date));

                                                if (dates.length === 0) return 'Select dates...';

                                                const min = new Date(Math.min(...dates));
                                                const max = new Date(Math.max(...dates));

                                                const minStr = min.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                                                const maxStr = max.toLocaleDateString('default', { month: 'short', year: 'numeric' });

                                                if (minStr === maxStr) return minStr;
                                                return `${minStr} - ${maxStr}`;
                                            })()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 border-b w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => {
                                                        const newConfigs = { ...subjectConfigs };
                                                        Object.keys(newConfigs).forEach(id => {
                                                            newConfigs[id].selected = e.target.checked;
                                                        });
                                                        setSubjectConfigs(newConfigs);
                                                    }}
                                                />
                                            </th>
                                            <th className="p-3 border-b">Subject</th>
                                            <th className="p-3 border-b">Exam Date</th>
                                            <th className="p-3 border-b">Start Time</th>
                                            <th className="p-3 border-b">End Time</th>
                                            <th className="p-3 border-b">Components</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {availableSubjects.map(sub => {
                                            const cfg = subjectConfigs[sub.id] || { selected: false, date: '', startTime: '09:00', endTime: '12:00' };

                                            // Calculate Min/Max Date for this Exam Type
                                            let minDate = '', maxDate = '';
                                            if (selectedExamType) {
                                                const year = new Date().getFullYear(); // Assume current year
                                                // Format: YYYY-MM-DD
                                                const sM = String(selectedExamType.start_month).padStart(2, '0');
                                                const eM = String(selectedExamType.end_month).padStart(2, '0');
                                                const eD = new Date(year, selectedExamType.end_month, 0).getDate(); // Last day of end month

                                                if (selectedExamType.start_month <= selectedExamType.end_month) {
                                                    minDate = `${year}-${sM}-01`;
                                                    maxDate = `${year}-${eM}-${eD}`;
                                                }
                                            }
                                            return (
                                                <tr key={sub.id} className={cfg.selected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}>
                                                    <td className="p-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={cfg.selected}
                                                            onChange={(e) => {
                                                                setSubjectConfigs({
                                                                    ...subjectConfigs,
                                                                    [sub.id]: { ...cfg, selected: e.target.checked }
                                                                });
                                                            }}
                                                            className="w-4 h-4 text-indigo-600 rounded"
                                                        />
                                                    </td>
                                                    <td className="p-3 font-medium">{sub.name}</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="date"
                                                            disabled={!cfg.selected}
                                                            min={minDate}
                                                            max={maxDate}
                                                            value={cfg.date}
                                                            onChange={(e) => setSubjectConfigs({
                                                                ...subjectConfigs,
                                                                [sub.id]: { ...cfg, date: e.target.value }
                                                            })}
                                                            className="border rounded px-2 py-1 w-full disabled:opacity-50 disabled:bg-slate-100"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="time"
                                                            disabled={!cfg.selected}
                                                            value={cfg.startTime}
                                                            onChange={(e) => setSubjectConfigs({
                                                                ...subjectConfigs,
                                                                [sub.id]: { ...cfg, startTime: e.target.value }
                                                            })}
                                                            className="border rounded px-2 py-1 w-full disabled:opacity-50 disabled:bg-slate-100"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input
                                                            type="time"
                                                            disabled={!cfg.selected}
                                                            value={cfg.endTime}
                                                            onChange={(e) => setSubjectConfigs({
                                                                ...subjectConfigs,
                                                                [sub.id]: { ...cfg, endTime: e.target.value }
                                                            })}
                                                            className="border rounded px-2 py-1 w-full disabled:opacity-50 disabled:bg-slate-100"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <button
                                                            onClick={() => setActiveConfigSubject({ id: sub.id, name: sub.name, components: cfg.components || [] })}
                                                            disabled={!cfg.selected}
                                                            className="flex items-center gap-1 text-sm bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded disabled:opacity-50 text-slate-700"
                                                        >
                                                            <Settings size={14} />
                                                            Configure ({cfg.components?.length || 0})
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {availableSubjects.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-400">
                                                    No subjects found. Please select classes first.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                                <button onClick={() => setShowAutoModal(false)} className="text-slate-600 hover:bg-slate-200 px-4 py-2 rounded font-bold">Cancel</button>
                                <button onClick={handleGenerate} className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded font-bold">Generate Schedule</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Exam Type Modal */}
            {
                showAddExamModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="font-bold text-lg">Add New Exam Type</h3>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-bold mb-2">Exam Type Name</label>
                                <input
                                    type="text"
                                    value={newExamName}
                                    onChange={(e) => setNewExamName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddExamType()}
                                    placeholder="e.g., Midterm, Final, Quiz"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="p-6 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                                <button
                                    onClick={() => {
                                        setShowAddExamModal(false);
                                        setNewExamName('');
                                    }}
                                    className="text-slate-600 hover:bg-slate-200 px-4 py-2 rounded font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddExamType}
                                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded font-bold"
                                >
                                    Add Exam Type
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Exam Type Modal */}
            {
                showEditExamModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="px-6 py-4 border-b border-slate-200">
                                <h3 className="font-bold text-lg">Edit Exam Type</h3>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-bold mb-2">Exam Type Name</label>
                                <input
                                    type="text"
                                    value={editExamName}
                                    onChange={(e) => setEditExamName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateExamType()}
                                    placeholder="e.g., Midterm, Final, Quiz"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                />
                            </div>
                            <div className="p-6 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
                                <button
                                    onClick={() => {
                                        setShowEditExamModal(false);
                                        setEditExamName('');
                                    }}
                                    className="text-slate-600 hover:bg-slate-200 px-4 py-2 rounded font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateExamType}
                                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded font-bold"
                                >
                                    Update
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Component Config Modal */}
            {activeConfigSubject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Exam Components: {activeConfigSubject.name}</h3>
                            <button onClick={() => setActiveConfigSubject(null)}><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-4">
                                Define mark breakdown (e.g. Theory: 80, Practical: 20).
                                {selectedExamType && (
                                    <span className="block mt-1 font-bold text-amber-600">Target Max Marks: {selectedExamType.max_marks}</span>
                                )}
                            </p>

                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 custom-scrollbar">
                                {activeConfigSubject.components.map((comp, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Name (e.g. Theory)"
                                            value={comp.name}
                                            onChange={(e) => {
                                                const newComps = [...activeConfigSubject.components];
                                                newComps[idx].name = e.target.value;
                                                setActiveConfigSubject({ ...activeConfigSubject, components: newComps });
                                            }}
                                            className="flex-1 border rounded px-2 py-1 text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max Marks"
                                            value={comp.max_marks}
                                            onChange={(e) => {
                                                const newComps = [...activeConfigSubject.components];
                                                newComps[idx].max_marks = parseFloat(e.target.value) || 0;
                                                setActiveConfigSubject({ ...activeConfigSubject, components: newComps });
                                            }}
                                            className="w-24 border rounded px-2 py-1 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                const newComps = activeConfigSubject.components.filter((_, i) => i !== idx);
                                                setActiveConfigSubject({ ...activeConfigSubject, components: newComps });
                                            }}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setActiveConfigSubject({
                                    ...activeConfigSubject,
                                    components: [...activeConfigSubject.components, { name: '', max_marks: 0 }]
                                })}
                                className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Component
                            </button>

                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className={`font-bold ${activeConfigSubject.components.reduce((sum, c) => sum + (c.max_marks || 0), 0) !== (selectedExamType?.max_marks || 100) ? 'text-amber-600' : 'text-green-600'}`}>
                                    Total: {activeConfigSubject.components.reduce((sum, c) => sum + (c.max_marks || 0), 0)}
                                    {selectedExamType && ` / ${selectedExamType.max_marks}`}
                                </span>
                                <button
                                    onClick={() => {
                                        // Save back to subjectConfigs
                                        setSubjectConfigs({
                                            ...subjectConfigs,
                                            [activeConfigSubject.id]: {
                                                ...subjectConfigs[activeConfigSubject.id],
                                                components: activeConfigSubject.components
                                            }
                                        });
                                        setActiveConfigSubject(null);
                                    }}
                                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-bold"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Single Schedule Item Modal */}
            {showEditItemModal && editItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Edit Schedule: {editItem.subject_name}</h3>
                            <button onClick={() => setShowEditItemModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Exam Date</label>
                                <input
                                    type="date"
                                    value={editItem.date}
                                    onChange={(e) => setEditItem({ ...editItem, date: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={editItem.startTime}
                                        onChange={(e) => setEditItem({ ...editItem, startTime: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={editItem.endTime}
                                        onChange={(e) => setEditItem({ ...editItem, endTime: e.target.value })}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Components (Marks Breakdown)</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {(editItem.components || []).map((comp, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={comp.name}
                                                onChange={(e) => {
                                                    const newComps = [...editItem.components];
                                                    newComps[idx].name = e.target.value;
                                                    setEditItem({ ...editItem, components: newComps });
                                                }}
                                                className="flex-1 border rounded px-2 py-1 text-sm"
                                                placeholder="Name"
                                            />
                                            <input
                                                type="number"
                                                value={comp.max_marks}
                                                onChange={(e) => {
                                                    const newComps = [...editItem.components];
                                                    newComps[idx].max_marks = parseFloat(e.target.value) || 0;
                                                    setEditItem({ ...editItem, components: newComps });
                                                }}
                                                className="w-20 border rounded px-2 py-1 text-sm"
                                                placeholder="Max"
                                            />
                                            <button onClick={() => {
                                                const newComps = editItem.components.filter((_, i) => i !== idx);
                                                setEditItem({ ...editItem, components: newComps });
                                            }} className="text-red-500 hover:bg-red-50 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setEditItem({
                                        ...editItem,
                                        components: [...(editItem.components || []), { name: '', max_marks: 0 }]
                                    })}
                                    className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm font-bold flex items-center gap-1 mt-2"
                                >
                                    <Plus size={16} /> Add Component
                                </button>
                            </div>

                            <div className="flex justify-between items-center text-sm pt-2">
                                <span className={`font-bold ${(editItem.components || []).reduce((s, c) => s + (parseFloat(c.max_marks) || 0), 0) !== (editItem.max_marks || 100)
                                    ? 'text-amber-600'
                                    : 'text-green-600'
                                    }`}>
                                    Total: {(editItem.components || []).reduce((s, c) => s + (parseFloat(c.max_marks) || 0), 0)} / {editItem.max_marks}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button onClick={() => setShowEditItemModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button onClick={handleUpdateScheduleItem} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-bold">
                                    Update Schedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

// Subcomponent for Class Multi-Select
const ClassMultiSelector = ({ classes, onAdd, onRemove, selected }) => {
    const [selClass, setSelClass] = useState('');
    const [selSection, setSelSection] = useState('');
    const [sections, setSections] = useState([]);

    useEffect(() => {
        if (selClass) {
            // Fetch sections using api
            api.get(`/classes/${selClass}/sections`).then(res => setSections(res.data)).catch(console.error);
        } else {
            setSections([]);
        }
    }, [selClass]);

    const handleAdd = () => {
        if (!selClass || !selSection) return;

        // Prevent duplicates
        if (selected.some(s => s.class_id === parseInt(selClass) && s.section_id === parseInt(selSection))) {
            toast.error('Class already added');
            return;
        }

        const cls = classes.find(c => c.id === parseInt(selClass));
        const sec = sections.find(s => s.id === parseInt(selSection));

        onAdd({
            class_id: parseInt(selClass),
            section_id: parseInt(selSection),
            class_name: cls?.name,
            section_name: sec?.name
        });
        setSelSection('');
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <select value={selClass} onChange={e => setSelClass(e.target.value)} className="w-1/3 px-2 py-1 text-sm border rounded">
                    <option value="">Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={selSection} onChange={e => setSelSection(e.target.value)} className="w-1/3 px-2 py-1 text-sm border rounded" disabled={!selClass}>
                    <option value="">Section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button onClick={handleAdd} disabled={!selSection} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded text-sm font-bold">
                    <Plus size={16} /> Add
                </button>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                {selected.map((item, idx) => (
                    <div key={idx} className="bg-slate-100 border border-slate-300 rounded-full px-3 py-1 text-xs flex items-center gap-1 font-bold text-slate-700">
                        {item.class_name} {item.section_name}
                        <button onClick={() => onRemove(idx)} className="hover:text-red-500"><Trash2 size={12} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ExamSchedule;
