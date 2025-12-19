import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { School, ShieldCheck, User, Users, GraduationCap, Briefcase, Bus, Eye, EyeOff, X, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('SCHOOL_ADMIN');
    const [errorMessage, setErrorMessage] = useState('');
    const [showQR, setShowQR] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear previous errors
        const result = await login(email, password, role);
        if (result.success) {
            toast.success('Welcome back!');
            switch (role) {
                case 'SCHOOL_ADMIN': navigate('/school-admin'); break;
                case 'TEACHER': navigate('/teacher'); break;
                case 'STUDENT': navigate('/student'); break;
                case 'STAFF': navigate('/staff'); break;
                default: navigate('/');
            }
        } else {
            setErrorMessage(result.message);
            toast.error(result.message);
        }
    };

    const roles = [
        { id: 'SCHOOL_ADMIN', label: 'School Admin', icon: School },
        { id: 'TEACHER', label: 'Teacher', icon: Users },
        { id: 'STUDENT', label: 'Student', icon: GraduationCap },
        { id: 'STAFF', label: 'Staff', icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20 relative z-10 transition-all duration-300 hover:shadow-indigo-500/20">
                <div className="text-center mb-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 transform rotate-3 hover:rotate-6 transition-transform">
                        <School className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection Grid */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Select Your Role</label>
                        <div className="grid grid-cols-2 gap-2">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setRole(r.id)}
                                    className={`p-2 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 h-16 border
                                        ${role === r.id
                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm transform scale-105'
                                            : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200 hover:shadow-sm'}`}
                                >
                                    <r.icon size={20} className={role === r.id ? 'text-indigo-600' : 'text-slate-400'} />
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1 ml-1">
                                {['STUDENT', 'TEACHER', 'STAFF'].includes(role) ? 'Email / Attendance ID' : 'Email Address'}
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition-all font-semibold text-sm text-slate-700 placeholder:text-slate-400"
                                placeholder={['STUDENT', 'TEACHER', 'STAFF'].includes(role) ? 'e.g. STU1234 or email@school.com' : 'admin@school.com'}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1 ml-1">
                                <label className="block text-xs font-bold text-slate-700">Password</label>
                                <Link to="/forgot-password" className="text-[10px] text-indigo-600 font-bold hover:underline">Forgot Password?</Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none transition-all font-semibold text-sm text-slate-700 placeholder:text-slate-400 pr-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 text-sm"
                    >
                        Access Portal
                    </button>

                    {errorMessage && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-xs font-bold text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                            {errorMessage}
                        </div>
                    )}

                    <p className="text-center text-[10px] text-slate-400 mt-3">
                        Having trouble? <a href="#" className="text-indigo-600 font-bold hover:underline">Contact Support</a>
                    </p>
                </form>

                {/* Mobile App Download Section */}
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <button
                        onClick={() => setShowQR(true)}
                        className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-semibold group"
                    >
                        <Smartphone size={16} className="group-hover:scale-110 transition-transform" />
                        Download Mobile App
                    </button>
                </div>
            </div>

            {/* QR Code Modal for Mobile App */}
            {showQR && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Get the Mobile App</h3>
                            <p className="text-sm text-slate-500 mb-6">Scan to download directly to your Android device</p>

                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 inline-block mb-4">
                                <QRCode
                                    value="http://10.60.101.164:5173/app.apk"
                                    size={200}
                                    level="H"
                                />
                            </div>

                            <p className="text-xs text-slate-400 break-all bg-slate-50 p-2 rounded">
                                http://10.60.101.164:5173/app.apk
                            </p>

                            <a
                                href="/app.apk"
                                download
                                className="mt-6 w-full inline-flex justify-center items-center gap-2 bg-indigo-600 text-white font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
                            >
                                <Smartphone size={16} />
                                Download .APK File
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
