import React from 'react';
import { LogOut } from 'lucide-react';

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                        <LogOut size={32} className="text-red-600 ml-1" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Logout Confirmation</h3>
                    <p className="text-gray-500 mb-8">Are you sure you want to end your session?</p>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogoutConfirmationModal;
