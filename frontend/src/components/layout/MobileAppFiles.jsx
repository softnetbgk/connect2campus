import React from 'react';
import { Home, Users, CreditCard, Menu, UserCheck, GraduationCap } from 'lucide-react';

export const MobileHeader = ({ title, onMenuClick, schoolName }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white z-[60] shadow-md safe-area-top flex flex-col justify-end md:hidden min-h-[5rem] pb-1">
            <div className="h-14 w-full flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                    {/* Logo/Icon */}
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <GraduationCap size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xs font-black text-white tracking-[0.2em] leading-none drop-shadow-md uppercase">Connect to Campus</h1>
                        <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-1">{schoolName || 'Software'}</p>
                    </div>
                </div>
                {/* Right Side Actions could go here */}
            </div>
        </div>
    );
};

export const MobileFooter = ({ activeTab, onTabChange, onMenuToggle }) => {
    const tabs = [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'student-list', label: 'Students', icon: Users },
        { id: 'fee-collection', label: 'Fees', icon: CreditCard },
        { id: 'student-attendance', label: 'Attendance', icon: UserCheck },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
            <div className="h-16 flex items-center justify-around">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{tab.label}</span>
                        </button>
                    );
                })}

                {/* Menu Toggle */}
                <button
                    onClick={onMenuToggle}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>
        </div>
    );
};
