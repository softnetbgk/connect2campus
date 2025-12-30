import React, { useState, useRef, useEffect } from 'react';
import { Search, Printer, FileText, Edit3, Download, Award, Calendar, User } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const CertificateGenerator = () => {
    const [selectedTheme, setSelectedTheme] = useState('classic');

    const [selectedType, setSelectedType] = useState('bonafide');
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [customText, setCustomText] = useState('');
    const [schoolDetails, setSchoolDetails] = useState({ name: 'School Name', address: 'Address Line 1' });

    useEffect(() => {
        const fetchSchoolDetails = async () => {
            try {
                const res = await api.get('/schools/my-school');
                setSchoolDetails(res.data);
            } catch (error) {
                console.error('Failed to fetch school details:', error);
            }
        };
        fetchSchoolDetails();
    }, []);

    // Certificate Templates Data
    const templates = {
        bonafide: {
            title: "BONAFIDE CERTIFICATE",
            color: "border-indigo-600",
            bg: "bg-indigo-50",
            text: (s) => `This is to certify that Master/Miss ${s.name}, Admission No. ${s.admission_no}, is a bonafide student of this school studying in Class ${s.class_name} Section ${s.section_name} for the academic year ${new Date().getFullYear()}-${new Date().getFullYear() + 1}.\n\nHis/Her date of birth as per our school records is ${new Date(s.dob).toLocaleDateString()}.\n\nHe/She bears a good moral character.`
        },
        character: {
            title: "CHARACTER CERTIFICATE",
            color: "border-emerald-600",
            bg: "bg-emerald-50",
            text: (s) => `This is to certify that Master/Miss ${s.name}, son/daughter of Mr. ${s.parent_name}, has been a student of this institution.\n\nDuring his/her stay in this school, to the best of my knowledge, he/she bears a good moral character and has displayed exemplary behavior.\n\nI wish him/her all the best for their future endeavors.`
        },
        transfer: {
            title: "TRANSFER CERTIFICATE",
            color: "border-slate-800",
            bg: "bg-slate-50",
            text: (s) => `TC Number: TC/${new Date().getFullYear()}/${s.id}\n\nName of Student: ${s.name}\nFather's Name: ${s.parent_name}\nDate of Birth: ${new Date(s.dob).toLocaleDateString()}\nClass Studying: ${s.class_name}\n\nThis is to certify that the above student has no dues pending and has returned all library books. The student is hereby permitted to leave the institution.`
        },
        sports: {
            title: "CERTIFICATE OF ACHIEVEMENT",
            color: "border-orange-500",
            bg: "bg-orange-50",
            text: (s) => `This is to proudly certify that Master/Miss ${s.name} of Class ${s.class_name} has participated in the Annual Sports Meet ${new Date().getFullYear()} and secured _______ position in ___________ event.\n\nWe commend their sportsmanship and dedication.`
        }
    };

    // Theme Styles
    const themes = {
        classic: {
            label: "Classic Border",
            containerClass: (color) => `border-[16px] ${color}`,
            bgStyle: {
                backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.02) 2px, transparent 2px)',
                backgroundSize: '24px 24px'
            }
        },
        elegant: {
            label: "Elegant Double",
            containerClass: (color) => `border-4 border-double ${color} p-16 shadow-inner ring-4 ring-offset-4 ring-slate-100`,
            bgStyle: { backgroundColor: '#fff9f0' } // Creamy background
        },
        modern: {
            label: "Modern Sidebar",
            containerClass: (color) => `border-l-[48px] ${color} bg-white shadow-xl`,
            bgStyle: {}
        },
        premium: {
            label: "Premium Frame",
            containerClass: (color) => `border-y-8 ${color} shadow-2xl`,
            bgStyle: {
                backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }
        }
    };

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Certificate-${selectedStudent?.name || 'Student'}`,
    });

    const handleSearch = async (e) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
        setSearchTerm(value);
        if (value.length > 2) {
            try {
                const res = await api.get(`/students?search=${value}`);
                setStudents(res.data);
            } catch (error) {
                console.error(error);
            }
        } else {
            setStudents([]);
        }
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setCustomText(templates[selectedType].text(student));
        setStudents([]);
        setSearchTerm('');
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        if (selectedStudent) {
            setCustomText(templates[type].text(selectedStudent));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header ... */}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Controls Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Theme Selection */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-3">Certificate Theme</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(themes).map(([key, theme]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedTheme(key)}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedTheme === key
                                        ? 'bg-slate-800 text-white border-slate-800'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {theme.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Certificate Type Selection */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        {/* ... (existing type buttons) ... */}
                        <label className="block text-sm font-bold text-slate-700 mb-3">Certificate Type</label>
                        <div className="space-y-2">
                            {[
                                { id: 'bonafide', label: 'Bonafide', icon: FileText },
                                { id: 'character', label: 'Character', icon: User },
                                { id: 'transfer', label: 'Transfer', icon: Download },
                                { id: 'sports', label: 'Sports', icon: Award },
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeChange(type.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedType === type.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <type.icon size={18} />
                                    {type.label} Certificate
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student Search & Edit Controls (Keep as is) */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Student</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search Name/ID..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        {students.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                                {students.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => selectStudent(s)}
                                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                    >
                                        <div className="font-bold text-slate-800">{s.name}</div>
                                        <div className="text-xs text-slate-500">Class {s.class_name} | ID: {s.admission_no}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-slate-700">Content</label>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="text-xs flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                                >
                                    <Edit3 size={12} /> {isEditing ? 'Done' : 'Edit'}
                                </button>
                            </div>
                            {isEditing && (
                                <textarea
                                    className="w-full h-40 p-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                                    value={customText}
                                    onChange={(e) => setCustomText(e.target.value)}
                                ></textarea>
                            )}
                            <button
                                onClick={handlePrint}
                                className="w-full mt-4 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <Printer size={18} /> Print Certificate
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview Area */}
                <div className="lg:col-span-3 bg-slate-100 p-8 rounded-xl flex items-center justify-center overflow-auto">
                    {selectedStudent ? (
                        <div className="print-area shadow-2xl" ref={componentRef}>
                            <div
                                className={`w-[800px] min-h-[600px] bg-white p-12 relative flex flex-col items-center text-center overflow-hidden ${themes[selectedTheme].containerClass(templates[selectedType].color)}`}
                                style={themes[selectedTheme].bgStyle}
                            >
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                    <Award size={400} />
                                </div>

                                {/* Header */}
                                <div className="z-10 w-full mb-8">
                                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white ${selectedTheme === 'modern' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                                        <Award size={32} />
                                    </div>
                                    <h1 className="text-2xl font-black text-slate-800 tracking-wider uppercase break-words px-4">
                                        {schoolDetails.name}
                                    </h1>
                                    <p className="text-slate-500 font-medium text-sm mt-1 px-8 break-words">
                                        {schoolDetails.address}
                                    </p>
                                </div>

                                {/* Title */}
                                <div className="z-10 mb-12">
                                    <span className={`px-8 py-2 text-xl font-bold uppercase tracking-[0.2em] border-b-2 ${templates[selectedType].color} text-slate-800`}>
                                        {templates[selectedType].title}
                                    </span>
                                </div>

                                {/* Body Text */}
                                <div className="z-10 flex-1 w-full px-12 flex items-center">
                                    <p className={`text-lg leading-loose text-slate-800 whitespace-pre-line text-justify w-full ${selectedTheme === 'elegant' ? 'font-serif italic' : 'font-serif'}`}>
                                        {customText}
                                    </p>
                                </div>

                                {/* Footer / Signatures */}
                                <div className="z-10 w-full flex justify-between items-end mt-auto pt-16">
                                    <div className="text-center">
                                        <div className="w-40 border-b border-slate-400 mb-2"></div>
                                        <p className="text-sm font-bold text-slate-600 uppercase">Class Teacher</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-32 h-12 mb-2 flex items-center justify-center">
                                            {/* Stamp Placeholer */}
                                            <div className={`w-20 h-20 rounded-full border-4 ${templates[selectedType].color} opacity-20 rotate-12`}></div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-40 border-b border-slate-400 mb-2"></div>
                                        <p className="text-sm font-bold text-slate-600 uppercase">Principal</p>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="absolute bottom-4 left-12 text-xs text-slate-400 font-mono">
                                    Generated on: {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <FileText size={40} className="opacity-20" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600">No Student Selected</h3>
                            <p>Search and select a student to preview their certificate.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;
