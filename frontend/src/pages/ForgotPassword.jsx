import React, { useState } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { School, Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react'; // Added icons
import loginBg from '../assets/login-bg.jpg';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('STUDENT');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post('/auth/forgot-password', { email, role });
            setMessage(response.data.message);
            toast.success('Reset link check console or email');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to request reset');
        } finally {
            setLoading(false);
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

            {/* Content Card - Glassmorphism */}
            <div className="relative z-10 w-full max-w-md p-4 mx-4">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] animate-fade-in-up">

                    <div className="text-center mb-8 space-y-2">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20 mb-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <KeyRound size={28} className="text-yellow-400" />
                        </div>
                        <h2 className="text-3xl font-cursive text-white drop-shadow-md">Recover Access</h2>
                        <p className="text-gray-300 text-xs tracking-wide uppercase font-medium">Reset your password securely</p>
                    </div>

                    {message ? (
                        <div className="text-center animate-fade-in-up">
                            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6 mb-6">
                                <p className="text-green-200 font-medium text-lg mb-2">Check your Email</p>
                                <p className="text-green-100/70 text-sm">{message}</p>
                                <p className="text-[10px] text-green-100/50 mt-4">(Check server console if testing locally)</p>
                            </div>
                            <Link
                                to="/login"
                                state={{ skipWelcome: true }}
                                className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-bold transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Role Selection */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Select Your Role</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-sans text-sm appearance-none cursor-pointer hover:bg-white/10"
                                    style={{ colorScheme: 'dark' }} // Forces dark scrollbar/options in some browsers
                                >
                                    <option value="STUDENT" className="bg-slate-900 text-white">Student</option>
                                    <option value="TEACHER" className="bg-slate-900 text-white">Teacher</option>
                                    <option value="STAFF" className="bg-slate-900 text-white">Staff</option>
                                    <option value="SCHOOL_ADMIN" className="bg-slate-900 text-white">School Admin</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email or ID</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all font-sans text-sm"
                                        placeholder="Enter your email or ID"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/20 transform transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
                            </button>

                            <div className="text-center mt-6">
                                <Link to="/login" state={{ skipWelcome: true }} className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                                    <ArrowLeft size={14} />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}

                    <div className="text-center mt-8">
                        <p className="text-white/30 text-[10px] font-cursive tracking-widest">Connect to Campus</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
