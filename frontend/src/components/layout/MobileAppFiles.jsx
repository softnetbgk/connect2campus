import React from 'react';
import { Home, Users, CreditCard, Menu, UserCheck, GraduationCap, ArrowLeft } from 'lucide-react';

export const MobileHeader = ({ title, onMenuClick, schoolName, onBack, userName, subtitle }) => {
    return (
        <div className="fixed top-0 left-0 right-0 bg-indigo-600 text-white z-[60] shadow-md safe-area-top flex flex-col justify-end md:hidden min-h-[5.5rem] pb-2 transition-all duration-300">
            <div className="h-auto py-1 w-full flex items-center px-4 justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    {/* Logo/Icon */}
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                        <GraduationCap size={22} className="text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-[10px] font-black text-white tracking-[0.2em] leading-none drop-shadow-md uppercase truncate">Connect to Campus</h1>
                        <p className="text-[11px] text-indigo-100 font-bold uppercase tracking-wider mt-0.5 truncate">{schoolName || 'Software'}</p>
                        {userName && (
                            <p className="text-[11px] font-medium text-white mt-0.5 leading-tight truncate">
                                <span className="font-bold">{userName}</span> {subtitle && <span className="opacity-80 text-[10px]"> • {subtitle}</span>}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {onMenuClick && (
                        <button
                            onClick={onMenuClick}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors active:scale-95"
                        >
                            <Menu size={22} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const MobileFooter = ({ activeTab, onTabChange, onMenuToggle, tabs }) => {
    const defaultTabs = [
        { id: 'overview', label: 'Home', icon: Home },
        { id: 'student-list', label: 'Students', icon: Users },
        { id: 'fee-collection', label: 'Fees', icon: CreditCard },
        { id: 'student-attendance', label: 'Attendance', icon: UserCheck },
    ];

    const displayTabs = tabs || defaultTabs;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden pt-1" style={{ paddingBottom: 'var(--sab)' }}>
            <div className="h-16 flex items-center justify-around">
                {displayTabs.map((tab) => {
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

