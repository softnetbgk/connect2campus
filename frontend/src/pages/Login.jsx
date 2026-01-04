import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { School, ShieldCheck, User, Users, GraduationCap, Briefcase, Bus, Eye, EyeOff, X, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Capacitor } from '@capacitor/core';

import loginBg from '../assets/login-bg.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('SCHOOL_ADMIN');
    const [errorMessage, setErrorMessage] = useState('');
    const [showQR, setShowQR] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Detect if running in mobile app (Capacitor or WebView with param)
    const isMobileApp = Capacitor.isNativePlatform() || new URLSearchParams(window.location.search).get('is_mobile_app') === 'true';

    const roles = [
        { id: 'SCHOOL_ADMIN', label: 'School Admin', icon: School },
        { id: 'TEACHER', label: 'Teacher', icon: Users },
        { id: 'STUDENT', label: 'Student', icon: GraduationCap },
        { id: 'STAFF', label: 'Staff Member', icon: Briefcase },
    ].filter(r => !isMobileApp || r.id !== 'SCHOOL_ADMIN');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        const result = await login(email, password, role);
        if (result.success) {
            // Check for must_change_password flag from backend
            if (result.user?.mustChangePassword) {
                toast('Please set a new password for security.', { icon: '🔒' });
                navigate('/change-password', { state: { email, role, oldPassword: password } });
                return;
            }

            toast.success('Welcome back!');
            switch (role) {
                case 'SCHOOL_ADMIN': navigate('/school-admin'); break;
                case 'TEACHER': navigate('/teacher'); break;
                case 'STUDENT': navigate('/student'); break;
                case 'STAFF':
                case 'DRIVER': navigate('/staff'); break;
                default: navigate('/');
            }
        } else {
            setErrorMessage(result.message);
            toast.error(result.message);
        }
    };


    return (
        <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Animated Background Image - Classroom */}
            <div className="absolute inset-0 w-full h-full z-0">
                <img
                    src={loginBg}
                    alt="Classroom Background"
                    className="w-full h-full object-cover animate-ken-burns"
                />
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Floating Modern Shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#00C9FC]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Login Card - Glassmorphism */}
            <div className="relative z-10 w-full max-w-sm p-4 mx-4">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] animate-fade-in-up">

                    <div className="text-center mb-6 space-y-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20 mb-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <School size={28} className="text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-cursive text-white drop-shadow-md">Welcome Back</h2>
                        <p className="text-gray-300 text-xs tracking-wide uppercase font-medium">Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Select Your Role</label>
                            <div className="grid grid-cols-2 gap-2">
                                {roles.map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id)}
                                        className={`p-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1 border h-16
                                            ${role === r.id
                                                ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)] transform scale-105'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30 hover:text-white'}`}
                                    >
                                        <r.icon size={20} className={role === r.id ? 'text-black' : 'text-gray-500 group-hover:text-white'} />
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-gray-400 ml-1 uppercase tracking-wider">
                                    {role === 'SCHOOL_ADMIN' ? 'Email or School ID' :
                                        ['STUDENT', 'TEACHER', 'STAFF'].includes(role) ? 'Your ID (Admission/Employee ID)' :
                                            'Email Address'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoComplete="off"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-sans text-sm"
                                    placeholder={role === 'SCHOOL_ADMIN' ? 'admin@school.com or 123456' :
                                        ['STUDENT', 'TEACHER', 'STAFF'].includes(role) ? 'e.g. STU1234 or 654321' :
                                            'admin@school.com'}
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                                    <Link to="/forgot-password" className="text-[10px] text-yellow-400 font-bold hover:text-yellow-300 transition-colors">Forgotten Password</Link>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        autoComplete="off"
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-sans text-sm pr-10"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/20 transform transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                        >
                            Access Portal
                        </button>

                        {errorMessage && (
                            <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-xl text-xs font-bold text-center border border-red-500/50 animate-in fade-in slide-in-from-top-1 backdrop-blur-sm">
                                {errorMessage}
                            </div>
                        )}

                        <div className="text-center mt-2">
                            <p className="text-white/30 text-[10px] font-cursive tracking-widest">Connect to Campus</p>
                        </div>
                    </form>

                    {/* Mobile App Download Section */}
                    {!isMobileApp && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <button
                                onClick={() => setShowQR(true)}
                                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors text-xs font-semibold group"
                            >
                                <Smartphone size={16} className="group-hover:scale-110 transition-transform" />
                                Download Android App
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center">
                            <h3 className="text-lg font-bold text-white mb-2">Get the Mobile App</h3>
                            <p className="text-sm text-gray-400 mb-6">Scan to download instantly</p>

                            <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
                                <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-100">
                                    <QRCode
                                        value="https://github.com/Rudrappa838/school-software/releases/download/SchoolAppv2.0/SchoolApp.apk"
                                        size={130}
                                        level="H"
                                    />
                                    <p className="text-[10px] text-slate-800 mt-2 font-mono font-bold">Android APK</p>
                                </div>
                                <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-100">
                                    <QRCode
                                        value={`${window.location.protocol}//${window.location.host}?is_mobile_app=true`}
                                        size={130}
                                        level="H"
                                    />
                                    <p className="text-[10px] text-slate-800 mt-2 font-mono font-bold">iOS App</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <a
                                    href="https://github.com/Rudrappa838/school-software/releases/download/SchoolAppv2.0/SchoolApp.apk"
                                    download="SchoolApp.apk"
                                    className="w-full inline-flex justify-center items-center gap-3 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors text-sm shadow-lg shadow-green-500/20"
                                >
                                    <Smartphone size={20} />
                                    Download for Android
                                </a>

                                <a
                                    href={`${window.location.origin}?is_mobile_app=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex justify-center items-center gap-3 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-lg shadow-slate-500/20"
                                >
                                    <Smartphone size={20} className="text-gray-400" />
                                    Launch iOS App
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
