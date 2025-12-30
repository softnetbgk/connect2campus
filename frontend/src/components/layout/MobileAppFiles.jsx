import React from 'react';
import { Home, Users, CreditCard, Menu, UserCheck, GraduationCap } from 'lucide-react';

export const MobileHeader = ({ title, onMenuClick, schoolName }) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-indigo-600 text-white z-[60] shadow-md flex items-center px-4 justify-between md:hidden safe-area-top">
            <div className="flex items-center gap-3">
                {/* Logo/Icon */}
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <GraduationCap size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-bold leading-tight line-clamp-1">{schoolName || 'School App'}</h1>
                    <p className="text-[10px] text-indigo-200 font-medium uppercase tracking-wider">{title || 'Dashboard'}</p>
                </div>
            </div>
            {/* Right Side Actions could go here */}
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
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-[60] flex items-center justify-around pb-safe safe-area-bottom md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
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
    );
};
