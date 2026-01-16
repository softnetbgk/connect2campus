import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SetupAdmin = () => {
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    const handleSetup = async () => {
        try {
            setStatus('Creating...');
            const res = await api.post('/auth/setup-admin', {
                email: 'admin@system.com',
                password: password
            });
            toast.success(res.data.message);
            setStatus('Success! Redirecting...');
            setTimeout(() => navigate('/super-admin-login'), 2000);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Setup failed';
            toast.error(msg);
            setStatus('Error: ' + msg);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-4">Initial Server Setup</h1>
            <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700">
                <p className="mb-4 text-gray-300">
                    This tool will create the first <b>Super Admin</b> account on your new server.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-bold mb-1">Super Admin Email</label>
                    <input
                        type="text"
                        value="admin@system.com"
                        disabled
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-400 cursor-not-allowed"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold mb-1">Set Password</label>
                    <input
                        type="text"
                        placeholder="Enter secure password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:border-[#00C9FC] outline-none"
                    />
                </div>

                <button
                    onClick={handleSetup}
                    className="w-full bg-[#00C9FC] hover:bg-cyan-500 text-white font-bold py-3 rounded transition-colors"
                >
                    Create Super Admin
                </button>

                {status && (
                    <div className={`mt-4 p-3 rounded text-center text-sm font-bold border ${status.includes('Error') ? 'bg-red-900/50 border-red-500' : 'bg-green-900/50 border-green-500'}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetupAdmin;
