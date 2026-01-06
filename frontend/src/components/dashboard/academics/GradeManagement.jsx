import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { toast } from 'react-hot-toast';
import { Save, Plus, Trash2, Award } from 'lucide-react';

const GradeManagement = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        try {
            const res = await api.get('/grades');
            if (res.data.length > 0) {
                setGrades(res.data);
            } else {
                // Default Template
                setGrades([
                    { name: 'A+', min_percentage: 90, max_percentage: 100, grade_point: 10, description: 'Outstanding' },
                    { name: 'A', min_percentage: 80, max_percentage: 89.99, grade_point: 9, description: 'Excellent' },
                    { name: 'B', min_percentage: 70, max_percentage: 79.99, grade_point: 8, description: 'Very Good' },
                    { name: 'C', min_percentage: 60, max_percentage: 69.99, grade_point: 7, description: 'Good' },
                    { name: 'D', min_percentage: 50, max_percentage: 59.99, grade_point: 6, description: 'Pass' },
                    { name: 'F', min_percentage: 0, max_percentage: 49.99, grade_point: 0, description: 'Fail' },
                ]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch grades');
        }
    };

    const handleAddRow = () => {
        setGrades([...grades, { name: '', min_percentage: 0, max_percentage: 100, grade_point: 0, description: '' }]);
    };

    const handleRemoveRow = (index) => {
        const updated = grades.filter((_, i) => i !== index);
        setGrades(updated);
    };

    const handleChange = (index, field, value) => {
        const updated = [...grades];
        updated[index][field] = value;
        setGrades(updated);
    };

    const handleSave = async () => {
        // Validation
        for (const g of grades) {
            if (!g.name) {
                toast.error('Grade Name is required for all rows');
                return;
            }
            if (parseFloat(g.min_percentage) >= parseFloat(g.max_percentage)) {
                toast.error(`Invalid range for grade ${g.name}: Min must be less than Max`);
                return;
            }
        }

        setLoading(true);
        try {
            await api.post('/grades', { grades });
            toast.success('Grades configuration saved successfully');
            fetchGrades();
        } catch (error) {
            console.error(error);
            toast.error('Failed to save grades');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Award size={28} />
                    Grade Configuration
                </h2>
                <p className="text-emerald-50 mt-1">Define grade ranges and points based on percentage</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-bold">
                            <tr>
                                <th className="p-3 border-b">Grade Name</th>
                                <th className="p-3 border-b">Min %</th>
                                <th className="p-3 border-b">Max %</th>
                                <th className="p-3 border-b">Grade Point</th>
                                <th className="p-3 border-b">Description</th>
                                <th className="p-3 border-b w-10">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {grades.map((grade, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={grade.name}
                                            onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                            className="w-full border rounded px-2 py-1 uppercase font-bold text-center"
                                            placeholder="A+"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={grade.min_percentage}
                                            onChange={(e) => handleChange(idx, 'min_percentage', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={grade.max_percentage}
                                            onChange={(e) => handleChange(idx, 'max_percentage', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center"
                                            step="0.01"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            value={grade.grade_point}
                                            onChange={(e) => handleChange(idx, 'grade_point', e.target.value)}
                                            className="w-full border rounded px-2 py-1 text-center"
                                            step="0.1"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={grade.description}
                                            onChange={(e) => handleChange(idx, 'description', e.target.value)}
                                            className="w-full border rounded px-2 py-1"
                                            placeholder="Remarks"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => handleRemoveRow(idx)} className="text-red-500 hover:text-red-700">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <button onClick={handleAddRow} className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
                        <Plus size={18} /> Add Row
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-emerald-200"
                    >
                        <Save size={18} /> Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeManagement;
