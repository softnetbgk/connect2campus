import React, { useState, useEffect } from 'react';
import { Save, Building } from 'lucide-react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

const SchoolSettings = () => {
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSchoolInfo();
    }, []);

    const loadSchoolInfo = async () => {
        try {
            const res = await api.get('/schools/my-school');
            setLogoUrl(res.data.logo || '');
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/schools/my-school/logo', { logo: logoUrl });
            toast.success('School Logo Updated!');
            window.location.reload(); // Refresh to reflect changes in Header immediately
        } catch (error) {
            toast.error('Failed to update logo');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto mt-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                <Building className="text-indigo-600" /> School Branding
            </h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">School Logo URL</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            placeholder="https://example.com/logo.png"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Provide a direct link to your school logo image (PNG/JPG).
                        This logo will appear on the Mobile App header and Login screen.
                    </p>
                </div>

                {logoUrl && (
                    <div className="border border-slate-200 rounded-lg p-4">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Preview</p>
                        <div className="bg-slate-50 rounded-lg p-4 flex justify-center items-center h-32">
                            <img
                                src={logoUrl}
                                alt="Logo Preview"
                                className="h-full object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    toast.error('Invalid Image URL');
                                }}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-slate-100">
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
    );
};

export default SchoolSettings;
