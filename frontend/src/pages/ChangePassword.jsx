import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    // Pre-fill from navigation state if available, otherwise blank
    const [email, setEmail] = useState(location.state?.email || '');
    const [oldPassword, setOldPassword] = useState(location.state?.oldPassword || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Visibility Toggles
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [loading, setLoading] = useState(false);

    // If they got here without logging in (direct link), ensure they are at least authenticated or have context
    // Actually, since we redirect AFTER login, they have a token.
    // But for security, we will ask for Old Password again as per user request ("enter id or email and old pssword")

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Email Handling: Capital letters allow -> so we normalize to lowercase for backend (or user asked to ALLOW capitals, but usually emails are case insensitive. I will just trim spaces). 
        // User said "email with capital lettes allow", so I will NOT lowercase it, just trim.
        const cleanEmail = email.trim();

        if (newPassword !== confirmPassword) {
            return toast.error('New passwords do not match');
        }

        if (newPassword === '123456' || newPassword === oldPassword) {
            return toast.error('Please choose a different password than the default.');
        }

        // Validate Password Strength
        // 1. No spaces
        if (/\s/.test(newPassword)) {
            return toast.error('Password must not contain spaces.');
        }
        // 2. At least 3 digits
        const digitCount = (newPassword.match(/\d/g) || []).length;
        if (digitCount < 3) {
            return toast.error('Password must contain at least 3 digits.');
        }
        // 3. At least 1 special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            return toast.error('Password must contain at least 1 special character.');
        }
        // 4. Minimum length (implied "atleast 3 characters" probably meant min length, but standard is 6+. I'll keep minLength=6 in input but enforce here too)
        if (newPassword.length < 6) {
            return toast.error('Password is too short (min 6 chars).');
        }

        setLoading(true);
        try {
            await axios.post('/auth/change-password', {
                email: cleanEmail,
                oldPassword,
                newPassword
            });

            toast.success('Password set successfully!');

            // Logout to force fresh login with new credentials (as per standard security practice)
            // Or "they have to login fetch dashboard" as per user request.
            await logout();
            navigate('/login');

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 transform transition-all">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400/20 mb-4">
                        <Lock size={32} className="text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Security Update Required</h2>
                    <p className="text-gray-400 text-sm mt-2">
                        Since this is your first login, please update your temporary password to secure your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ID / Email (Read Only or Editable) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">User ID / Email</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400 transition-colors"
                            placeholder="Enter your ID or Email"
                            required
                        />
                    </div>

                    {/* Old Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password (123456)</label>
                        <div className="relative">
                            <input
                                type={showOld ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400 transition-colors pr-10"
                                placeholder="Enter current password"
                                required
                            />
                            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-4"></div>

                    {/* New Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400 transition-colors pr-10"
                                placeholder="Create new password"
                                required
                                minLength={6}
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-yellow-400 transition-colors pr-10"
                                placeholder="Retype new password"
                                required
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-gray-400 hover:text-white">
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg shadow-yellow-400/20 transform transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? 'Updating...' : 'Set New Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
