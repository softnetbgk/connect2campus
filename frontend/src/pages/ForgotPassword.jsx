import React, { useState } from 'react';
import axios from '../api/axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Forgot Password</h2>

                {message ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg text-center mb-6">
                        {message}
                        <br />
                        <span className="text-sm mt-2 block">(Check server console if no email configured)</span>
                        <div className="mt-4">
                            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Back to Login</Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            >
                                <option value="STUDENT">Student</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="STAFF">Staff</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email or ID</label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your email or ID"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Processing...' : 'Send Reset Link'}
                        </button>
                        <div className="text-center mt-4">
                            <Link to="/login" className="text-sm text-gray-600 hover:text-indigo-600">Back to Login</Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
