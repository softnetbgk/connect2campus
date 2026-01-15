import React, { useState, useEffect } from 'react';
import { Save, Building, Upload, Image as ImageIcon, Trash2, Calendar, Layers } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import ClassManagement from './ClassManagement';
import AcademicYearSettings from '../settings/AcademicYearSettings';

import { useAuth } from '../../../context/AuthContext';

const SchoolSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'academic-year', 'classes'
    const [logoUrl, setLogoUrl] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSchoolInfo();
    }, []);

    const loadSchoolInfo = async () => {
        try {
            setLoading(true);
            const response = await api.get('/schools/my-school');
            if (response.data) {
                // Assuming response.data contains school info directly or wrapped
                const school = response.data.data || response.data; // Handle potential wrapping
                setLogoUrl(school.logo || '');
            }
        } catch (error) {
            console.error('Error loading school info:', error);
            // toast.error('Failed to load school settings'); 
            // Suppress error if 404/empty to avoid annoying user on first load? 
            // But 'my-school' should exist if logged in.
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result);
            };
            reader.readAsDataURL(file);
            setLogoFile(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoUrl('');
        setLogoFile(null);
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                await api.put('/schools/my-school/logo', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Settings saved successfully');
                setLogoFile(null);
                // Reload info to get any processed URL if needed
                loadSchoolInfo();
            } else {
                toast.success('Settings saved successfully');
            }

        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('branding')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'branding'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Building size={20} />
                        School Branding
                    </button>
                    <button
                        onClick={() => setActiveTab('academic-year')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'academic-year'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Calendar size={20} />
                        Academic Year
                    </button>
                    {user?.role === 'SUPER_ADMIN' && (
                        <button
                            onClick={() => setActiveTab('classes')}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'classes'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Layers size={20} />
                            Classes & Sections
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'branding' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                        <Building className="text-indigo-600" /> School Branding
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">School Logo</label>

                            <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                {logoUrl ? (
                                    <div className="relative group">
                                        <img
                                            src={logoUrl}
                                            alt="Logo Preview"
                                            className="h-32 object-contain"
                                        />
                                        <button
                                            onClick={handleRemoveLogo}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                            title="Remove Logo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="bg-indigo-100 p-3 rounded-full inline-block mb-3">
                                            <ImageIcon className="text-indigo-600" size={32} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">Click to upload logo</p>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                                    </div>
                                )}

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title={logoUrl ? "Click to change logo" : "Click to upload logo"}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                This logo will appear in the Sidebar and Mobile App Header.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <Save size={18} /> {loading ? 'Saving Changes...' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Academic Year Tab */}
            {activeTab === 'academic-year' && (
                <AcademicYearSettings />
            )}

            {/* Classes Tab */}
            {activeTab === 'classes' && user?.role === 'SUPER_ADMIN' && (
                <ClassManagement />
            )}
        </div>
    );
};

export default SchoolSettings;
