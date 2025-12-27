import React, { useState, useEffect } from 'react';
import { Award, Download, Save, Printer, Eye, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../api/axios';

const MarksManagement = ({ config }) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [examTypes, setExamTypes] = useState([]);
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [marks, setMarks] = useState({});
    const [loading, setLoading] = useState(false);
    const [showExamModal, setShowExamModal] = useState(false);
    const [showMarksheetModal, setShowMarksheetModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [marksheetData, setMarksheetData] = useState(null);

    // New Exam with Components
    const [newExam, setNewExam] = useState({
        name: '',
        max_marks: 100,
        weightage: 0,
        start_month: new Date().getMonth() + 1,
        end_month: new Date().getMonth() + 1,
        components: []
    });

    const sections = config?.classes?.find(c => c.class_id === parseInt(selectedClass))?.sections || [];

    const months = [
        'January', 'February', 'March', '"April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchExamTypes();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchStudents();
        }
    }, [selectedClass, selectedSection]);

    useEffect(() => {
        if (selectedClass && selectedSection && selectedExam) {
            fetchMarks();
        }
    }, [selectedClass, selectedSection, selectedExam]);

    const fetchExamTypes = async () => {
        try {
            const res = await api.get('/marks/exam-types');
            setExamTypes(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchSubjects = async () => {
        const classData = config?.classes?.find(c => c.class_id === parseInt(selectedClass));
        if (classData) {
            setSubjects(classData.subjects || []);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get(`/students?class_id=${selectedClass}&section_id=${selectedSection}`);
            setStudents(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMarks = async () => {
        if (!selectedClass || !selectedSection || !selectedExam) return;

        setMarks({}); // Clear marks before fetching to avoid stale keys
        try {
            const res = await api.get(`/marks?class_id=${selectedClass}&section_id=${selectedSection}&exam_type_id=${selectedExam}`);
            console.log('Fetched marks data:', res.data);
            const existingMarks = {};

            // Populate marks object from fetched data
            if (res.data && Array.isArray(res.data)) {
                res.data.forEach(mark => {
                    // Check if this mark has components
                    if (mark.components && mark.components.length > 0) {
                        // Component-based marks
                        mark.components.forEach(comp => {
                            const key = `${mark.student_id}-${mark.subject_id}-${comp.component_id}`;
                            existingMarks[key] = comp.marks_obtained;
                        });
                    } else {
                        // Simple marks
                        const key = `${mark.student_id}-${mark.subject_id}`;
                        existingMarks[key] = mark.marks_obtained;
                    }
                });
            }

            console.log('Final existingMarks object:', existingMarks);
            setMarks(existingMarks);
        } catch (error) {
            console.error('Error fetching marks:', error);
            toast.error('Failed to load marks');
        }
    };

    const selectedExamType = examTypes.find(e => e.id === parseInt(selectedExam));
    const hasComponents = selectedExamType?.components?.length > 0;

    const addComponent = () => {
        setNewExam({
            ...newExam,
            components: [...newExam.components, { name: '', max_marks: 0 }]
        });
    };

    const removeComponent = (index) => {
        const updated = newExam.components.filter((_, i) => i !== index);
        setNewExam({ ...newExam, components: updated });
    };

    const updateComponent = (index, field, value) => {
        const updated = [...newExam.components];
        updated[index][field] = value;
        setNewExam({ ...newExam, components: updated });
    };

    const handleCreateExamType = async () => {
        if (!newExam.name) {
            toast.error('Please enter exam name');
            return;
        }

        // Validate components if present
        if (newExam.components.length > 0) {
            const totalComponentMarks = newExam.components.reduce((sum, c) => sum + parseInt(c.max_marks || 0), 0);
            if (totalComponentMarks !== parseInt(newExam.max_marks)) {
                toast.error(`Component marks must add up to ${newExam.max_marks}`);
                return;
            }
        }

        try {
            await api.post('/marks/exam-types', newExam);
            toast.success('Exam type created!');
            setNewExam({ name: '', max_marks: 100, weightage: 0, start_month: new Date().getMonth() + 1, end_month: new Date().getMonth() + 1, components: [] });
            setShowExamModal(false);
            fetchExamTypes();
        } catch (error) {
            toast.error('Failed to create exam type');
            console.error(error);
        }
    };

    const handleMarkChange = (studentId, subjectId, componentId, value, maxMarks) => {
        if (parseFloat(value) > parseFloat(maxMarks)) {
            toast.error(`Marks cannot exceed ${maxMarks}`);
            return;
        }
        const key = componentId
            ? `${studentId}-${subjectId}-${componentId}`
            : `${studentId}-${subjectId}`;
        setMarks(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        if (!selectedExam) {
            toast.error('Please select an exam type');
            return;
        }

        const marksArray = [];

        // Handle marks with or without components
        Object.keys(marks).forEach(key => {
            if (marks[key] === '' || marks[key] === undefined) return;

            const parts = key.split('-');

            if (hasComponents) {
                // Must have 3 parts: studentId-subjectId-componentId
                if (parts.length !== 3) return;

                const [studentId, subjectId, componentId] = parts;
                marksArray.push({
                    student_id: parseInt(studentId),
                    class_id: parseInt(selectedClass),
                    section_id: parseInt(selectedSection),
                    subject_id: parseInt(subjectId),
                    exam_type_id: parseInt(selectedExam),
                    component_id: parseInt(componentId),
                    marks_obtained: parseFloat(marks[key])
                });
            } else {
                // Must have 2 parts: studentId-subjectId
                if (parts.length !== 2) return;

                const [studentId, subjectId] = parts;
                marksArray.push({
                    student_id: parseInt(studentId),
                    class_id: parseInt(selectedClass),
                    section_id: parseInt(selectedSection),
                    subject_id: parseInt(subjectId),
                    exam_type_id: parseInt(selectedExam),
                    marks_obtained: parseFloat(marks[key])
                });
            }
        });

        if (marksArray.length === 0) {
            toast.error('Please enter at least one mark');
            return;
        }

        console.log('Sending marks to backend:', marksArray);

        setLoading(true);
        try {
            await api.post('/marks/save', { marks: marksArray });
            toast.success('Marks saved successfully!');
            fetchMarks(); // Reload marks to show saved data
        } catch (error) {
            toast.error('Failed to save marks');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewMarksheet = async (student) => {
        if (!selectedExam) {
            toast.error('Please select an exam type');
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/marks/marksheet/student?student_id=${student.id}&exam_type_id=${selectedExam}`);
            setMarksheetData(res.data);
            setSelectedStudent(student);
            setShowMarksheetModal(true);
        } catch (error) {
            toast.error('Failed to load marksheet');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintAll = async () => {
        if (!selectedClass || !selectedSection || !selectedExam) {
            toast.error('Please select class, section, and exam type');
            return;
        }

        try {
            const res = await api.get(`/marks/marksheet/all?class_id=${selectedClass}&section_id=${selectedSection}&exam_type_id=${selectedExam}`);
            console.log('All marksheets:', res.data);
            toast.success('Opening print preview...');
            setTimeout(() => window.print(), 500);
        } catch (error) {
            toast.error('Failed to generate marksheets');
            console.error(error);
        }
    };

    const handlePrintMarksheet = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header - Same as before */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white print:hidden">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award size={28} />
                    Marks Management
                </h2>
                <p className="text-amber-50 mt-1">Enter and manage student marks with component support</p>
            </div>

            {/* Filters - Same as before */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 print:hidden">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {/* Year, Month, Class, Section, Exam selectors - keeping existing code */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month</label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                            {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Class</label>
                        <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                            <option value="">Select Class</option>
                            {config?.classes?.map(c => <option key={c.class_id} value={c.class_id}>{c.class_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Section</label>
                        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" disabled={!selectedClass}>
                            <option value="">Select Section</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                            <span>Exam Type</span>
                            <button onClick={() => setShowExamModal(true)} className="text-amber-600 hover:text-amber-700">
                                <Plus size={14} />
                            </button>
                        </label>
                        <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm">
                            <option value="">Select Exam</option>
                            {examTypes.map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.name} ({e.components?.length > 0 ? `${e.components.length} components` : `Max: ${e.max_marks}`})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={handleSave} disabled={loading || !selectedExam} className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Save size={16} /> Save Marks
                    </button>
                    <button onClick={fetchMarks} disabled={!selectedExam} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Eye size={16} /> Reload Marks
                    </button>
                    <button onClick={handlePrintAll} disabled={!selectedExam} className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                        <Printer size={16} /> Print All
                    </button>
                </div>
            </div>

            {/* Marks Entry Grid - ENHANCED FOR COMPONENTS */}
            {students.length > 0 && subjects.length > 0 && selectedExam ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-amber-50">
                                <tr>
                                    <th className="border border-amber-200 p-3 font-bold text-amber-900 sticky left-0 bg-amber-50">Roll</th>
                                    <th className="border border-amber-200 p-3 font-bold text-amber-900">Student</th>
                                    {subjects.map(sub => (
                                        <th key={sub.id} className="border border-amber-200 p-3 font-bold text-amber-900" colSpan={hasComponents ? selectedExamType.components.length : 1}>
                                            {sub.name}
                                            {hasComponents && (
                                                <div className="text-[10px] font-normal text-amber-600 mt-1">
                                                    {selectedExamType.components.map(c => c.component_name).join(' / ')}
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                    <th className="border border-amber-200 p-3 font-bold text-amber-900">Actions</th>
                                </tr>
                                {hasComponents && (
                                    <tr>
                                        <th colSpan="2"></th>
                                        {subjects.map(sub => (
                                            <React.Fragment key={sub.id}>
                                                {selectedExamType.components.map(comp => (
                                                    <th key={comp.id} className="border border-amber-200 p-2 text-[11px] text-amber-700">
                                                        {comp.component_name} ({comp.max_marks})
                                                    </th>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                        <th></th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id} className="hover:bg-slate-50">
                                        <td className="border border-slate-200 p-3 text-center font-mono sticky left-0 bg-white">{student.roll_number}</td>
                                        <td className="border border-slate-200 p-3 font-medium">{student.name}</td>
                                        {subjects.map(subject => (
                                            <React.Fragment key={subject.id}>
                                                {hasComponents ? (
                                                    selectedExamType.components.map(component => (
                                                        <td key={component.id} className="border border-slate-200 p-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={component.max_marks}
                                                                step="0.5"
                                                                value={marks[`${student.id}-${subject.id}-${component.id}`] !== undefined ? marks[`${student.id}-${subject.id}-${component.id}`] : ''}
                                                                onChange={(e) => handleMarkChange(student.id, subject.id, component.id, e.target.value, component.max_marks)}
                                                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none text-center"
                                                                placeholder="-"
                                                            />
                                                        </td>
                                                    ))
                                                ) : (
                                                    <td className="border border-slate-200 p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={selectedExamType?.max_marks || 100}
                                                            step="0.5"
                                                            value={marks[`${student.id}-${subject.id}`] !== undefined ? marks[`${student.id}-${subject.id}`] : ''}
                                                            onChange={(e) => handleMarkChange(student.id, subject.id, null, e.target.value, selectedExamType?.max_marks || 100)}
                                                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none text-center"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        <td className="border border-slate-200 p-2 text-center">
                                            <button onClick={() => handleViewMarksheet(student)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto">
                                                <Eye size={12} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center print:hidden">
                    <Award size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium">Select filters to start entering marks</p>
                </div>
            )}

            {/* Create Exam Type Modal - ENHANCED FOR COMPONENTS */}
            {showExamModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
                            <h3 className="text-lg font-bold text-amber-900">Create Exam Type</h3>
                            <p className="text-xs text-amber-600 mt-1">Select exam period (can span two months) and add components for Internal/External marks</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Exam Name</label>
                                    <input type="text" value={newExam.name} onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} placeholder="e.g., Midterm, Final" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Total Max Marks</label>
                                    <input type="number" value={newExam.max_marks} onChange={(e) => setNewExam({ ...newExam, max_marks: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Start Month</label>
                                    <select value={newExam.start_month} onChange={(e) => setNewExam({ ...newExam, start_month: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                                        {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">End Month</label>
                                    <select value={newExam.end_month} onChange={(e) => setNewExam({ ...newExam, end_month: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                                        {months.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            {newExam.start_month !== newExam.end_month && (
                                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                                    <strong>Exam Period:</strong> {months[newExam.start_month - 1]} - {months[newExam.end_month - 1]}
                                </div>
                            )}

                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-slate-700">Components (Optional)</label>
                                    <button onClick={addComponent} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <Plus size={14} /> Add Component
                                    </button>
                                </div>
                                {newExam.components.length > 0 && (
                                    <div className="space-y-2">
                                        {newExam.components.map((comp, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg">
                                                <input type="text" value={comp.name} onChange={(e) => updateComponent(idx, 'name', e.target.value)} placeholder="e.g., Internal" className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                                <input type="number" value={comp.max_marks} onChange={(e) => updateComponent(idx, 'max_marks', parseInt(e.target.value))} placeholder="Max marks" className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                                                <button onClick={() => removeComponent(idx)} className="text-red-600 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                                            <strong>Total:</strong> {newExam.components.reduce((sum, c) => sum + (parseInt(c.max_marks) || 0), 0)} / {newExam.max_marks} marks
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowExamModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-100">
                                Cancel
                            </button>
                            <button onClick={handleCreateExamType} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-2">
                                <Plus size={16} /> Create Exam Type
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Marksheet Modal */}
            {showMarksheetModal && marksheetData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Print Header - School Name */}
                        <div className="hidden print:block text-center py-6 border-b-2 border-slate-300">
                            <h1 className="text-3xl font-bold text-slate-900">{config?.name || 'School Name'}</h1>
                            <p className="text-sm text-slate-600 mt-2">Student Marksheet</p>
                        </div>

                        {/* Modal Header - Hidden in Print */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex justify-between items-center print:hidden">
                            <h3 className="text-lg font-bold">Student Marksheet</h3>
                            <div className="flex gap-2">
                                <button onClick={handlePrintMarksheet} className="text-white hover:text-indigo-100">
                                    <Printer size={20} />
                                </button>
                                <button onClick={() => setShowMarksheetModal(false)} className="text-white hover:text-indigo-100">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Student Info */}
                            <div className="mb-6 pb-4 border-b border-slate-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Student Name</div>
                                        <div className="text-lg font-bold text-slate-800">{marksheetData.student.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Roll Number</div>
                                        <div className="text-lg font-bold text-slate-800">{marksheetData.student.roll_number}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Class</div>
                                        <div className="font-medium text-slate-700">{marksheetData.student.class_name} - {marksheetData.student.section_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Exam</div>
                                        <div className="font-medium text-slate-700">{marksheetData.marks[0]?.exam_name || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Marks Table */}
                            <table className="w-full text-sm border-collapse mb-6">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="border border-slate-200 p-3 font-bold text-slate-700 text-left">Subject</th>
                                        <th className="border border-slate-200 p-3 font-bold text-slate-700 text-center">Max Marks</th>
                                        <th className="border border-slate-200 p-3 font-bold text-slate-700 text-center">Marks Obtained</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marksheetData.marks.map(mark => (
                                        <tr key={mark.id}>
                                            <td className="border border-slate-200 p-3">{mark.subject_name}</td>
                                            <td className="border border-slate-200 p-3 text-center">{mark.max_marks}</td>
                                            <td className="border border-slate-200 p-3 text-center font-bold">{mark.marks_obtained}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-amber-50">
                                        <td className="border border-amber-200 p-3 font-bold">Total</td>
                                        <td className="border border-amber-200 p-3 text-center font-bold">{marksheetData.summary.max_marks}</td>
                                        <td className="border border-amber-200 p-3 text-center font-bold">{marksheetData.summary.total_marks}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Percentage */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg mb-8">
                                <div className="text-center">
                                    <div className="text-sm text-slate-600 font-bold uppercase mb-1">Percentage</div>
                                    <div className="text-3xl font-bold text-emerald-600">{marksheetData.summary.percentage}%</div>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="grid grid-cols-2 gap-8 mt-12 pt-8">
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-400 pt-2 mt-16">
                                        <p className="text-sm font-bold text-slate-700">Class Teacher</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-400 pt-2 mt-16">
                                        <p className="text-sm font-bold text-slate-700">Principal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarksManagement;
