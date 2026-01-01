import React, { useState } from 'react';
import {
    Wand2, Image as ImageIcon, FileText, Download, RefreshCw,
    Plus, Trash2, Save, CheckCircle, BrainCircuit, Type, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../../api/axios';

const QuestionPaperGenerator = ({ config: academicConfig }) => {
    const [mode, setMode] = useState('text'); // 'text' or 'image'
    const [generating, setGenerating] = useState(false);
    const [questions, setQuestions] = useState([]);

    // Configuration State
    const [paperConfig, setPaperConfig] = useState({
        topic: '',
        classId: '', // Store ID instead of name
        sectionId: '',
        subject: '',
        difficulty: 'medium', // easy, medium, hard
        questionCount: 5,
        type: 'mixed' // mcq, descriptive, mixed
    });

    const [files, setFiles] = useState([]);

    // Get Sections for selected class
    const availableSections = React.useMemo(() => {
        if (!academicConfig?.classes || !paperConfig.classId) return [];
        const selectedClass = academicConfig.classes.find(c => c.class_id.toString() === paperConfig.classId.toString());
        return selectedClass?.sections || [];
    }, [academicConfig, paperConfig.classId]);

    // Get Subjects for selected class
    const availableSubjects = React.useMemo(() => {
        if (!academicConfig?.classes || !paperConfig.classId) return ['General'];
        const selectedClass = academicConfig.classes.find(c => c.class_id.toString() === paperConfig.classId.toString());
        return selectedClass?.subjects?.map(s => s.name) || ['General Knowledge', 'Science', 'Math'];
    }, [academicConfig, paperConfig.classId]);

    // Real AI Generation Logic
    const handleGenerate = async () => {
        if (mode === 'text' && !paperConfig.topic) return toast.error("Please enter a topic");
        if (mode === 'image' && files.length === 0) return toast.error("Please upload an image (Image analysis coming soon!)");

        setGenerating(true);
        setQuestions([]); // Clear previous

        try {
            // resolve class name
            const selectedClass = academicConfig?.classes?.find(c => c.class_id.toString() === paperConfig.classId.toString());
            const className = selectedClass ? selectedClass.class_name : 'Grade 10';

            const payload = {
                topic: paperConfig.topic,
                subject: paperConfig.subject,
                classLevel: className,
                difficulty: paperConfig.difficulty,
                questionCount: paperConfig.questionCount,
                type: paperConfig.type
            };

            const res = await api.post('/ai/generate-questions', payload);

            if (res.data.questions) {
                setQuestions(res.data.questions);
                toast.success("Questions Generated Successfully!");
            }

        } catch (error) {
            console.error(error);
            if (error.response?.data?.missingKey) {
                toast.error("AI Key Missing in Backend. Please contact Admin.");
                // Optional: Prompt user for key here if you want to support BYOK (Bring Your Own Key)
            } else {
                toast.error(error.response?.data?.message || "Failed to generate questions");
            }
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleFileUpload = (e) => {
        const fileList = Array.from(e.target.files);
        setFiles(fileList);
        toast.success(`${fileList.length} images uploaded`);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="text-indigo-600" /> AI Question Paper Generator
                    </h1>
                    <p className="text-slate-500 text-sm">Generate exam papers instantly from Topics or Images using AI</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors">
                        <Save size={18} /> Save Draft
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-500/20">
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Configuration */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Mode Selection */}
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex">
                        <button
                            onClick={() => setMode('text')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === 'text' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Type size={18} /> Topic Based
                        </button>
                        <button
                            onClick={() => setMode('image')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${mode === 'image' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ImageIcon size={18} /> Image Based
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">

                        {mode === 'text' ? (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic / Syllabus</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
                                    rows="4"
                                    placeholder="e.g., Photosynthesis, Newton's Laws, World War II..."
                                    value={paperConfig.topic}
                                    onChange={(e) => setPaperConfig({ ...paperConfig, topic: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Upload Source Material</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                            <ImageIcon size={24} />
                                        </div>
                                        <p className="font-bold text-slate-600">Click or Drag images here</p>
                                        <p className="text-xs text-slate-400">Scan of textbook page, handwritten notes, etc.</p>
                                    </div>
                                </div>
                                {files.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {files.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                                <CheckCircle size={14} className="text-emerald-500" />
                                                <span className="truncate">{f.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Class</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                                    value={paperConfig.classId}
                                    onChange={(e) => setPaperConfig({ ...paperConfig, classId: e.target.value, sectionId: '', subject: '' })}
                                >
                                    <option value="">Select Class</option>
                                    {academicConfig?.classes?.map(c => (
                                        <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Section</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                                    value={paperConfig.sectionId}
                                    onChange={(e) => setPaperConfig({ ...paperConfig, sectionId: e.target.value })}
                                    disabled={!paperConfig.classId}
                                >
                                    <option value="">All Sections</option>
                                    {availableSections.map(sec => (
                                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                                <select
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium"
                                    value={paperConfig.subject}
                                    onChange={(e) => setPaperConfig({ ...paperConfig, subject: e.target.value })}
                                >
                                    <option value="">Select Subject</option>
                                    {availableSubjects.map((sub, i) => (
                                        <option key={i} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Difficulty & Type</label>
                            <div className="flex gap-2 mb-3">
                                {['Easy', 'Medium', 'Hard'].map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => setPaperConfig({ ...paperConfig, difficulty: lvl.toLowerCase() })}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${paperConfig.difficulty === lvl.toLowerCase() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Number of Questions: {paperConfig.questionCount}</label>
                            <input
                                type="range"
                                min="1" max="20"
                                value={paperConfig.questionCount}
                                onChange={(e) => setPaperConfig({ ...paperConfig, questionCount: parseInt(e.target.value) })}
                                className="w-full accent-indigo-600"
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all ${generating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:scale-[1.02]'}`}
                        >
                            {generating ? (
                                <>
                                    <RefreshCw className="animate-spin" /> Processing AI...
                                </>
                            ) : (
                                <>
                                    <Wand2 /> Generate Paper
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="lg:col-span-8">
                    <div className="bg-white min-h-[600px] rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-slate-400" /> Generated Preview
                            </h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {questions.length} Questions
                            </span>
                        </div>

                        <div className="flex-1 p-8 space-y-6">
                            {questions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 min-h-[400px]">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                        <Wand2 size={32} className="opacity-50" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-lg text-slate-400">Your paper is empty</p>
                                        <p className="text-sm">Configure settings and click Generate</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                    {/* Paper Header */}
                                    <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
                                        <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Final Examination</h2>
                                        <div className="flex justify-between mt-4 text-sm font-bold text-slate-600">
                                            <span>Subject: {paperConfig.subject || 'General'}</span>
                                            {/* Find class Name from ID */}
                                            <span>Class: {academicConfig?.classes?.find(c => c.class_id.toString() === paperConfig.classId)?.class_name || 'Grade 10'}</span>
                                            <span>Time: 2 Hours</span>
                                        </div>
                                    </div>

                                    {/* Questions */}
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="group relative pl-4 hover:bg-slate-50 rounded-lg p-4 -mx-4 transition-colors">
                                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-slate-200"><RefreshCw size={14} /></button>
                                                <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 shadow-sm border border-transparent hover:border-slate-200"><Trash2 size={14} /></button>
                                            </div>

                                            <div className="flex gap-4">
                                                <span className="font-bold text-slate-800 min-w-[24px]">Q{idx + 1}.</span>
                                                <div className="flex-1">
                                                    <p className="text-slate-800 font-medium mb-3">{q.question}</p>

                                                    {q.type === 'MCQ' && (
                                                        <div className="grid grid-cols-2 gap-3 pl-2">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                                                    <span className="text-sm text-slate-600">{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {q.type === 'Descriptive' && (
                                                        <div className="w-full h-20 border-b border-slate-200 border-dotted mt-2"></div>
                                                    )}
                                                </div>
                                                <div className="text-xs font-bold text-slate-400">
                                                    [{q.marks} Marks]
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionPaperGenerator;
